from django.db import models
from users.models import User
from hostels.models import Hostel

class Bid(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('countered', 'Countered'),
        )
        
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bids')
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name='bids')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    message = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    counter_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    counter_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.full_name} bid ₦{self.amount} on {self.hostel.title}"