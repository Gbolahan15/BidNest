from rest_framework import serializers
from .models import Booking
from hostels.serializers import HostelSerializer
from users.serializers import UserSerializer


class BookingSerializer(serializers.ModelSerializer):
    hostel = HostelSerializer(read_only=True)
    student = UserSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'student', 'hostel', 'bid', 'amount',
            'payment_status', 'payment_reference', 'created_at', 'paid_at'
        ]