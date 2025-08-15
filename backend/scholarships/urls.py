from django.urls import path
from .views import (
    ScholarshipListView,
    ToggleWishlistAPIView,
    UserWishlistAPIView,
    AddToWishlistFromAPI,
    remove_from_wishlist,  
    MyCalendarView,
    get_recommended_scholarships_api
)

urlpatterns = [
    path('scholarships/', ScholarshipListView.as_view(), name='scholarship-list'),
    path('wishlist/toggle/', ToggleWishlistAPIView.as_view(), name='wishlist-toggle'),
    path('wishlist/', UserWishlistAPIView.as_view(), name='wishlist-list'),
    path('wishlist/add-from-api/', AddToWishlistFromAPI.as_view(), name='wishlist-add-from-api'),  # ✅ 이 줄 추가
    path('wishlist/delete/<int:pk>/', remove_from_wishlist, name='wishlist-delete'),
    path("calendar/", MyCalendarView.as_view(), name="my-calendar"),
    path('recommendation/', get_recommended_scholarships_api, name='recommend-scholarships-api'),
]