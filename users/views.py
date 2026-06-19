from django.shortcuts import render
# Create your views here.
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer, StudentProfileSerializer, LandlordProfileSerializer
from .models import StudentProfile, LandlordProfile
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'Account is disabled'}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'student':
            try:
                profile = StudentProfile.objects.get(user=user)
                serializer = StudentProfileSerializer(profile)
            except StudentProfile.DoesNotExist:
                return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            try:
                profile = LandlordProfile.objects.get(user=user)
                serializer = LandlordProfileSerializer(profile)
            except LandlordProfile.DoesNotExist:
                return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response(serializer.data)

    def put(self, request):
        user = request.user
        if user.role == 'student':
            profile = StudentProfile.objects.get(user=user)
            serializer = StudentProfileSerializer(profile, data=request.data, partial=True)
        else:
            profile = LandlordProfile.objects.get(user=user)
            serializer = LandlordProfileSerializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        role = request.data.get('role', 'student')

        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            idinfo = id_token.verify_oauth2_token(
                token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except ValueError:
            return Response({'error': 'Invalid Google token'}, status=status.HTTP_400_BAD_REQUEST)

        email = idinfo.get('email')
        full_name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': full_name,
                'role': role,
            }
        )

        if created:
            user.set_unusable_password()
            user.is_verified = True
            user.save()

            if user.role == 'student':
                StudentProfile.objects.create(user=user)
            elif user.role == 'landlord':
                LandlordProfile.objects.create(user=user)

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'created': created,
        })