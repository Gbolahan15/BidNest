from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import RoommateGroup, RoommateMember
from .serializers import RoommateGroupSerializer, RoommateGroupCreateSerializer
from notifications.models import Notification


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'


class RoommateGroupListCreateView(generics.ListCreateAPIView):
    queryset = RoommateGroup.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RoommateGroupCreateSerializer
        return RoommateGroupSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsStudent()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = RoommateGroup.objects.all()
        hostel_id = self.request.query_params.get('hostel')
        if hostel_id:
            queryset = queryset.filter(hostel_id=hostel_id)
        return queryset

    def get_serializer_context(self):
        return {'request': self.request}


class JoinRoommateGroupView(APIView):
    permission_classes = [IsStudent]

    def post(self, request, group_id):
        try:
            group = RoommateGroup.objects.get(id=group_id)
        except RoommateGroup.DoesNotExist:
            return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

        if group.is_full or group.current_members_count >= group.max_members:
            return Response({'error': 'This group is already full'}, status=status.HTTP_400_BAD_REQUEST)

        existing = RoommateMember.objects.filter(group=group, student=request.user).first()
        if existing:
            return Response({'error': 'You already requested to join this group'}, status=status.HTTP_400_BAD_REQUEST)

        RoommateMember.objects.create(group=group, student=request.user, status='pending')
        
        # Notify group creator
        Notification.objects.create(
            user=group.created_by,
            type='roommate_request',
            title='New Roommate Request',
            message=f'{request.user.full_name} wants to join your group "{group.title}"',
            link=f'/hostels/{group.hostel.id}'
        )

        return Response({'message': 'Join request sent successfully'}, status=status.HTTP_201_CREATED)


class RespondToJoinRequestView(APIView):
    permission_classes = [IsStudent]

    def put(self, request, member_id):
        try:
            member = RoommateMember.objects.get(
                id=member_id,
                group__created_by=request.user
            )
        except RoommateMember.DoesNotExist:
            return Response({'error': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ['accepted', 'rejected']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        member.status = new_status
        member.save()

        # Check if group is now full
        group = member.group
        accepted_count = group.members.filter(status='accepted').count()
        if accepted_count >= group.max_members:
            group.is_full = True
            group.save()

        # Notify the student who requested
        Notification.objects.create(
            user=member.student,
            type='roommate_response',
            title=f'Roommate Request {new_status.capitalize()}',
            message=f'Your request to join "{group.title}" was {new_status}',
            link=f'/hostels/{group.hostel.id}'
        )

        return Response({'message': f'Request {new_status}'})


class MyRoommateGroupsView(generics.ListAPIView):
    serializer_class = RoommateGroupSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return RoommateGroup.objects.filter(members__student=self.request.user).distinct()