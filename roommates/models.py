from django.db import models
from django.db import models
from users.models import User
from hostels.models import Hostel

class RoommateGroup(models.Model):
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name='roommate_groups')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_groups')
    title = models.CharField(max_length=255)
    description = models.TextField()
    max_members = models.PositiveIntegerField(default=2)
    is_full = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.hostel.title}"

    @property
    def current_members_count(self):
        return self.members.filter(status='accepted').count()


class RoommateMember(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )

    group = models.ForeignKey(RoommateGroup, on_delete=models.CASCADE, related_name='members')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='roommate_memberships')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'student')

    def __str__(self):
        return f"{self.student.full_name} in {self.group.title}"
    