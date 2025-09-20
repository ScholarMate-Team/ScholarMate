# community/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CommentViewSet, ConversationViewSet, DirectMessageViewSet

router = DefaultRouter()
router.register(r"community/posts", PostViewSet, basename="community-post")
router.register(r"community/comments", CommentViewSet, basename="community-comment")
router.register(r"community/conversations", ConversationViewSet, basename="community-conv")
router.register(r"community/messages", DirectMessageViewSet, basename="community-msg")

urlpatterns = [
    path("", include(router.urls)),
]
