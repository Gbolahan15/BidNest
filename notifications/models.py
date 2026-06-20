from django.db import models
from users.models import User


class Notification(models.Model):
    TYPE_CHOICES = (
        ('new_bid', 'New Bid'),
        ('bid_accepted', 'Bid Accepted'),
        ('bid_rejected', 'Bid Rejected'),
        ('bid_countered', 'Bid Countered'),
        ('new_message', 'New Message'),
        ('roommate_request', 'Roommate Request'),
        ('roommate_response', 'Roommate Response'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    link = models.CharField(max_length=255, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.full_name} - {self.title}"