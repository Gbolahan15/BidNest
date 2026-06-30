from django.db import models
from users.models import User
from hostels.models import Hostel
from bids.models import Bid


class Booking(models.Model):
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    )

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name='bookings')
    bid = models.OneToOneField(Bid, on_delete=models.CASCADE, related_name='booking')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_reference = models.CharField(max_length=255, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.full_name} - {self.hostel.title} - {self.payment_status}"