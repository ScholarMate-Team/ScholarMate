from django.contrib import admin
from .models import Contact

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "created_at")
    list_filter = ("created_at",)
    search_fields = ("name", "email", "message")
    ordering = ("-created_at",)
