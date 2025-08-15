from rest_framework import serializers
from .models import UserScholarship

class UserScholarshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserScholarship
        fields = "__all__"
