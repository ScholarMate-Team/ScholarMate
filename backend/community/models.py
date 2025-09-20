from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


# =========================
# 커뮤니티 (게시글/댓글/좋아요/북마크)
# =========================
class Post(models.Model):
    CATEGORY_CHOICES = [
        ("story", "스토리/후기(블로그형)"),
        ("feed", "피드/질문(가벼운 글)"),
    ]
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="community_posts")
    scholarship_name = models.CharField(max_length=255, blank=True, default="")
    category = models.CharField(max_length=16, choices=CATEGORY_CHOICES, default="story")
    title = models.CharField(max_length=255)
    content = models.TextField()
    tags = models.JSONField(default=list, blank=True)  # ["면접","자소서"]
    author_is_recipient = models.BooleanField(default=False)  # 수혜자 배지용(추후 인증 로직 연동)
    is_published = models.BooleanField(default=True)
    view_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.category}] {self.title}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="community_comments")
    content = models.TextField()
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE, related_name="replies")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]  # 오래된 댓글 먼저

    def __str__(self):
        return f"Comment({self.author_id}) on Post({self.post_id})"


class PostLike(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="post_likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("post", "user")


class PostBookmark(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="bookmarks")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="post_bookmarks")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("post", "user")


# =========================
# 1:1 쪽지(대화/메시지)
# =========================
class Conversation(models.Model):
    """
    1:1 전용. participants는 정확히 2명으로 운용.
    """
    participants = models.ManyToManyField(User, related_name="conversations")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        ids = list(self.participants.values_list("id", flat=True))
        return f"DM{ids}"

    def has_user(self, user):
        return self.participants.filter(id=user.id).exists()


class DirectMessage(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            # 최신 메시지 조회 및 읽음 여부 카운팅 최적화
            models.Index(fields=["conversation", "-created_at"]),  # MySQL에선 -가 무시돼도 OK
            models.Index(fields=["conversation", "is_read"]),
        ]

    def __str__(self):
        return f"DM from {self.sender_id} in Conversation({self.conversation_id})"
