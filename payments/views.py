import requests
import uuid
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Booking
from .serializers import BookingSerializer
from bids.models import Bid
from notifications.models import Notification


class InitiatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        bid_id = request.data.get('bid_id')

        try:
            bid = Bid.objects.get(id=bid_id, student=request.user, status='accepted')
        except Bid.DoesNotExist:
            return Response({'error': 'Valid accepted bid not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check if booking already exists
        existing_booking = Booking.objects.filter(bid=bid).first()
        if existing_booking and existing_booking.payment_status == 'paid':
            return Response({'error': 'This bid has already been paid for'}, status=status.HTTP_400_BAD_REQUEST)

        amount = bid.counter_amount if bid.status == 'countered' else bid.amount
        reference = f"bidnest-{uuid.uuid4().hex[:12]}"

        # Create or update booking
        booking, created = Booking.objects.get_or_create(
            bid=bid,
            defaults={
                'student': request.user,
                'hostel': bid.hostel,
                'amount': amount,
                'payment_reference': reference,
            }
        )
        if not created:
            booking.payment_reference = reference
            booking.save()

        # Initialize Paystack transaction
        url = "https://api.paystack.co/transaction/initialize"
        headers = {
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "email": request.user.email,
            "amount": int(float(amount) * 100),  # Paystack uses kobo
            "reference": reference,
            "metadata": {
                "booking_id": booking.id,
                "hostel_title": bid.hostel.title,
            }
        }

        response = requests.post(url, json=payload, headers=headers)
        data = response.json()

        if not data.get('status'):
            return Response({'error': 'Failed to initialize payment'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'authorization_url': data['data']['authorization_url'],
            'reference': reference,
            'booking_id': booking.id,
        })


class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        reference = request.data.get('reference')

        if not reference:
            return Response({'error': 'Reference is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = Booking.objects.get(payment_reference=reference)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        # Verify with Paystack
        url = f"https://api.paystack.co/transaction/verify/{reference}"
        headers = {"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"}
        response = requests.get(url, headers=headers)
        data = response.json()

        if data.get('status') and data['data']['status'] == 'success':
            from django.utils import timezone
            booking.payment_status = 'paid'
            booking.paid_at = timezone.now()
            booking.save()

            # Mark hostel as occupied
            hostel = booking.hostel
            hostel.status = 'occupied'
            hostel.save()

            # Notify landlord
            Notification.objects.create(
                user=hostel.landlord,
                type='new_bid',
                title='Payment Received!',
                message=f'{booking.student.full_name} has paid for {hostel.title}',
                link='/dashboard'
            )

            return Response({'message': 'Payment verified successfully', 'booking': BookingSerializer(booking).data})
        else:
            booking.payment_status = 'failed'
            booking.save()
            return Response({'error': 'Payment verification failed'}, status=status.HTTP_400_BAD_REQUEST)


class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(student=self.request.user)