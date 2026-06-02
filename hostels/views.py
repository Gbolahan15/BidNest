from django.shortcuts import render
from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Hostel, HostelImage, HostelReview
from .serializers import HostelSerializer, HostelCreateSerializer, HostelImageSerializer, HostelReviewSerializer

class IsLandlord(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'landlord'

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'

# List all hostels (students browse) & create (landlords post)
class HostelListCreateView(generics.ListCreateAPIView):
    queryset = Hostel.objects.all().order_by('-created_at')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'location', 'address', 'category']
    ordering_fields = ['price', 'created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return HostelCreateSerializer
        return HostelSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsLandlord()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Hostel.objects.all().order_by('-created_at')

        # Filters
        category = self.request.query_params.get('category')
        status = self.request.query_params.get('status')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        location = self.request.query_params.get('location')

        if category:
            queryset = queryset.filter(category=category)
        if status:
            queryset = queryset.filter(status=status)
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        if location:
            queryset = queryset.filter(location__icontains=location)

        return queryset


# Get, update, delete a single hostel
class HostelDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Hostel.objects.all()
    serializer_class = HostelSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsLandlord()]

    def update(self, request, *args, **kwargs):
        hostel = self.get_object()
        if hostel.landlord != request.user:
            return Response({'error': 'You can only edit your own listings'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        hostel = self.get_object()
        if hostel.landlord != request.user:
            return Response({'error': 'You can only delete your own listings'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


# Upload images to a hostel
class HostelImageUploadView(APIView):
    permission_classes = [IsLandlord]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            hostel = Hostel.objects.get(pk=pk, landlord=request.user)
        except Hostel.DoesNotExist:
            return Response({'error': 'Hostel not found'}, status=status.HTTP_404_NOT_FOUND)

        images = request.FILES.getlist('images')
        uploaded = []
        for image in images:
            img = HostelImage.objects.create(hostel=hostel, image=image)
            uploaded.append(HostelImageSerializer(img).data)

        return Response(uploaded, status=status.HTTP_201_CREATED)

# Landlord's own listings
class MyHostelsView(generics.ListAPIView):
    serializer_class = HostelSerializer
    permission_classes = [IsLandlord]

    def get_queryset(self):
        return Hostel.objects.filter(landlord=self.request.user).order_by('-created_at')

# Reviews
class HostelReviewView(APIView):
    permission_classes = [IsStudent]

    def post(self, request, pk):
        try:
            hostel = Hostel.objects.get(pk=pk)
        except Hostel.DoesNotExist:
            return Response({'error': 'Hostel not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = HostelReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(hostel=hostel, student=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)