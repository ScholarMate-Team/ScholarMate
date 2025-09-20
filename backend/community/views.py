# community/views.py
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import (
    F, Count, Exists, OuterRef, Value, BooleanField, Q, Subquery
)
from django.shortcuts import get_object_or_404

from .models import (
    Post, Comment, PostLike, PostBookmark,
    Conversation, DirectMessage,
)
from .serializers import (
    PostSerializer, CommentSerializer,
    ConversationSerializer, DirectMessageSerializer,
)
from .permissions import IsAuthorOrReadOnly


# === 게시글 ===
class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["category", "author_is_recipient", "scholarship_name"]
    search_fields = ["title", "content", "tags", "scholarship_name", "author__username"]
    ordering_fields = ["created_at", "updated_at", "view_count"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = (
            Post.objects.filter(is_published=True)
            .select_related("author")
            .annotate(
                likes_count=Count("likes", distinct=True),
                bookmarks_count=Count("bookmarks", distinct=True),
                comments_count=Count("comments", distinct=True),
            )
        )
        user = getattr(self.request, "user", None)
        if user and user.is_authenticated:
            qs = qs.annotate(
                is_liked=Exists(PostLike.objects.filter(post=OuterRef("pk"), user=user)),
                is_bookmarked=Exists(PostBookmark.objects.filter(post=OuterRef("pk"), user=user)),
            )
        else:
            qs = qs.annotate(
                is_liked=Value(False, output_field=BooleanField()),
                is_bookmarked=Value(False, output_field=BooleanField()),
            )
        return qs

    def get_permissions(self):
        if self.action in ["list", "retrieve", "increment_view"]:
            return [AllowAny()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsAuthorOrReadOnly()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[AllowAny])
    def increment_view(self, request, pk=None):
        Post.objects.filter(pk=pk).update(view_count=F("view_count") + 1)
        return Response({"ok": True})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        PostLike.objects.get_or_create(post=post, user=request.user)
        return Response({"liked": True})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def unlike(self, request, pk=None):
        post = self.get_object()
        PostLike.objects.filter(post=post, user=request.user).delete()
        return Response({"liked": False})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def bookmark(self, request, pk=None):
        post = self.get_object()
        PostBookmark.objects.get_or_create(post=post, user=request.user)
        return Response({"bookmarked": True})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def unbookmark(self, request, pk=None):
        post = self.get_object()
        PostBookmark.objects.filter(post=post, user=request.user).delete()
        return Response({"bookmarked": False})

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_bookmarks(self, request):
        qs = self.filter_queryset(self.get_queryset()).filter(bookmarks__user=request.user)
        page = self.paginate_queryset(qs)
        if page is not None:
            ser = self.get_serializer(page, many=True)
            return self.get_paginated_response(ser.data)
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)


# === 댓글 ===
class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related("author", "post")
    serializer_class = CommentSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["post", "parent"]
    ordering = ["created_at"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsAuthorOrReadOnly()]
        return [IsAuthenticated()]


# === 1:1 대화 ===
class ConversationViewSet(mixins.ListModelMixin,
                          mixins.RetrieveModelMixin,   # ✅ 상세 조회 추가
                          mixins.CreateModelMixin,
                          mixins.DestroyModelMixin,    # ✅ 삭제(나가기)
                          viewsets.GenericViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        latest = DirectMessage.objects.filter(
            conversation=OuterRef("pk")
        ).order_by("-created_at")

        qs = (
            Conversation.objects.filter(participants=user)
            .prefetch_related("participants")
            .annotate(
                latest_message=Subquery(latest.values("content")[:1]),
                latest_time=Subquery(latest.values("created_at")[:1]),
                latest_sender_id=Subquery(latest.values("sender_id")[:1]),
                unread_count=Count(
                    "messages",
                    filter=Q(messages__is_read=False) & ~Q(messages__sender_id=user.id),
                ),
                participant_count=Count("participants", distinct=True),   # ✅ 남은 인원
            )
            .order_by("-latest_time", "-created_at")
        )
        return qs

    def create(self, request, *args, **kwargs):
        recipient = None
        rid = request.data.get("recipient_id")
        run = request.data.get("recipient_username")

        from django.contrib.auth import get_user_model
        User = get_user_model()

        if rid:
            recipient = User.objects.filter(id=rid).first()
        elif run:
            recipient = User.objects.filter(username=run).first()

        if not recipient:
            return Response({"detail": "상대 사용자를 찾을 수 없습니다."}, status=400)
        if recipient.id == request.user.id:
            return Response({"detail": "본인과의 대화는 생성할 수 없습니다."}, status=400)

        conv = (
            Conversation.objects
            .filter(participants=request.user)
            .filter(participants=recipient)
            .first()
        )
        created = False
        if not conv:
            conv = Conversation.objects.create()
            conv.participants.add(request.user, recipient)
            created = True

        ser = self.get_serializer(conv, context={"request": request})
        return Response(
            ser.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    # 삭제(나가기)
    def destroy(self, request, pk=None):
        conv = get_object_or_404(
            Conversation.objects.prefetch_related("participants").filter(participants=request.user),
            pk=pk
        )
        conv.participants.remove(request.user)
        if conv.participants.count() == 0:
            conv.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # 나가기 액션 (프론트 폴백용)
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def leave(self, request, pk=None):
        conv = get_object_or_404(
            Conversation.objects.prefetch_related("participants").filter(participants=request.user),
            pk=pk
        )
        conv.participants.remove(request.user)
        if conv.participants.count() == 0:
            conv.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # 읽음 처리
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_read(self, request, pk=None):
        try:
            conv = Conversation.objects.prefetch_related("participants").get(pk=pk)
        except Conversation.DoesNotExist:
            return Response({"detail": "대화를 찾을 수 없습니다."}, status=404)

        if not conv.participants.filter(id=request.user.id).exists():
            return Response({"detail": "이 대화에 참여자가 아닙니다."}, status=403)

        updated = DirectMessage.objects.filter(
            conversation_id=pk,
            is_read=False
        ).exclude(sender=request.user).update(is_read=True)

        return Response({"marked": updated})


# === 1:1 메시지 ===
class DirectMessageViewSet(mixins.ListModelMixin,
                           mixins.CreateModelMixin,
                           viewsets.GenericViewSet):
    serializer_class = DirectMessageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["conversation"]
    ordering = ["created_at"]

    def get_queryset(self):
        qs = DirectMessage.objects.select_related("conversation", "sender")
        return qs.filter(conversation__participants=self.request.user)

    def create(self, request, *args, **kwargs):
        conv_id = request.data.get("conversation")
        if not conv_id:
            return Response({"detail": "conversation 필수"}, status=400)

        try:
            conv = Conversation.objects.prefetch_related("participants").get(id=conv_id)
        except Conversation.DoesNotExist:
            return Response({"detail": "대화를 찾을 수 없습니다."}, status=404)

        # 내가 참가자인지
        if not conv.participants.filter(id=request.user.id).exists():
            return Response({"detail": "이 대화에 참여자가 아닙니다."}, status=403)

        # ✅ 상대가 없는 방이면 전송 차단
        other_exists = conv.participants.exclude(id=request.user.id).exists()
        if not other_exists:
            return Response(
                {"detail": "상대방이 대화방을 삭제하여 채팅이 불가합니다.", "code": "PARTNER_MISSING"},
                status=409,  # Conflict
            )

        return super().create(request, *args, **kwargs)

