from rest_framework import serializers
from .models import RoommateGroup, RoommateMember
from users.serializers import UserSerializer
from hostels.serializers import HostelSerializer


class RoommateMemberSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)

    class Meta:
        model = RoommateMember
        fields = ['id', 'student', 'status', 'joined_at']


class RoommateGroupSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    hostel = HostelSerializer(read_only=True)
    members = RoommateMemberSerializer(many=True, read_only=True)
    current_members_count = serializers.ReadOnlyField()

    class Meta:
        model = RoommateGroup
        fields = [
            'id', 'hostel', 'created_by', 'title', 'description',
            'max_members', 'is_full', 'members', 'current_members_count',
            'created_at'
        ]


class RoommateGroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoommateGroup
        fields = ['hostel', 'title', 'description', 'max_members']

    def create(self, validated_data):
        request = self.context.get('request')
        group = RoommateGroup.objects.create(created_by=request.user, **validated_data)
        # Auto-add creator as accepted member
        RoommateMember.objects.create(
            group=group,
            student=request.user,
            status='accepted'
        )
        return group