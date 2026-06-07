from rest_framework import serializers
from .models import Bid
from users.serializers import UserSerializer
from hostels.serializers import HostelSerializer

class BidSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    hostel = HostelSerializer(read_only=True)

    class Meta:
        model = Bid
        fields = [
            'id', 'student', 'hostel', 'amount', 'message',
            'status', 'counter_amount', 'counter_message',
            'created_at', 'updated_at']


class BidCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bid
        fields = ['hostel', 'amount', 'message']

    def create(self, validated_data):
        request = self.context.get('request')
        bid = Bid.objects.create(student=request.user, **validated_data)
        return bid

class BidRespondSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bid
        fields = ['status', 'counter_amount', 'counter_message']