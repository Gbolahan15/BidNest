from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Bid
from .serializers import BidSerializer, BidCreateSerializer, BidRespondSerializer
from hostels.models import Hostel
from notifications.models import Notification


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'


class IsLandlord(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'landlord'


class PlaceBidView(generics.CreateAPIView):
    serializer_class = BidCreateSerializer
    permission_classes = [IsStudent]

    def create(self, request, *args, **kwargs):
        hostel_id = request.data.get('hostel')
        existing = Bid.objects.filter(
            student=request.user,
            hostel_id=hostel_id,
            status='pending'
        ).first()
        if existing:
            return Response(
                {'error': 'You already have a pending bid on this hostel'},
                status=status.HTTP_400_BAD_REQUEST
            )
        response = super().create(request, *args, **kwargs)

        # Create notification for landlord
        hostel = Hostel.objects.get(id=hostel_id)
        Notification.objects.create(
            user=hostel.landlord,
            type='new_bid',
            title='New Bid Received',
            message=f'{request.user.full_name} placed a bid of ₦{request.data.get("amount")} on {hostel.title}',
            link=f'/dashboard'
        )

        return response

    def get_serializer_context(self):
        return {'request': self.request}


class MyBidsView(generics.ListAPIView):
    serializer_class = BidSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return Bid.objects.filter(student=self.request.user)


class HostelBidsView(generics.ListAPIView):
    serializer_class = BidSerializer
    permission_classes = [IsLandlord]

    def get_queryset(self):
        hostel_id = self.kwargs.get('hostel_id')
        return Bid.objects.filter(
            hostel_id=hostel_id,
            hostel__landlord=self.request.user
        )


class RespondToBidView(APIView):
    permission_classes = [IsLandlord]

    def put(self, request, bid_id):
        try:
            bid = Bid.objects.get(
                id=bid_id,
                hostel__landlord=request.user
            )
        except Bid.DoesNotExist:
            return Response({'error': 'Bid not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = BidRespondSerializer(bid, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # Notify student
            status_messages = {
                'accepted': ('Bid Accepted!', f'Your bid on {bid.hostel.title} was accepted!'),
                'rejected': ('Bid Rejected', f'Your bid on {bid.hostel.title} was rejected.'),
                'countered': ('Counter Offer Received', f'You received a counter offer on {bid.hostel.title}.'),
            }
            if bid.status in status_messages:
                title, message = status_messages[bid.status]
                Notification.objects.create(
                    user=bid.student,
                    type=f'bid_{bid.status}',
                    title=title,
                    message=message,
                    link='/dashboard'
                )

            return Response(BidSerializer(bid).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)