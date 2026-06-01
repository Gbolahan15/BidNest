from rest_framework import serializers
from .models import Hostel, HostelImage, HostelReview
from users.serializers import UserSerializer

class HostelImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostelImage
        fields = ['id', 'image', 'is_main', 'uploaded_at']

class HostelReviewSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)

    class Meta:
        model = HostelReview
        fields = ['id', 'student', 'rating', 'comment', 'created_at']

class HostelSerializer(serializers.ModelSerializer):
    images = HostelImageSerializer(many=True, read_only=True)
    reviews = HostelReviewSerializer(many=True, read_only=True)
    landlord = UserSerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Hostel
        fields = [
            'id', 'landlord', 'title', 'description', 'category',
            'price', 'location', 'address', 'latitude', 'longitude',
            'status', 'amenities', 'is_verified', 'images', 'reviews',
            'average_rating', 'created_at', 'updated_at']
        read_only_fields = ['landlord', 'is_verified']

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 1)
        return None

class HostelCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hostel
        fields = [
            'title', 'description', 'category', 'price',
            'location', 'address', 'latitude', 'longitude',
            'amenities']

    def create(self, validated_data):
        request = self.context.get('request')
        hostel = Hostel.objects.create(landlord=request.user, **validated_data)
        return hostel