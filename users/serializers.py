from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudentProfile, LandlordProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['full_name', 'email', 'phone', 'role', 'password', 'confirm_password']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)

        # Auto create profile based on role
        if user.role == 'student':
            StudentProfile.objects.create(user=user)
        elif user.role == 'landlord':
            LandlordProfile.objects.create(user=user)

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone', 'role', 'is_verified', 'profile_picture', 'date_joined']


class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = StudentProfile
        fields = ['user', 'school', 'student_id', 'bio']


class LandlordProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = LandlordProfile
        fields = ['user', 'business_name', 'address', 'id_document', 'is_id_verified', 'bio']