from django.contrib import admin
from .models import Bid


@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display = ['student', 'hostel', 'amount', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['student__full_name', 'hostel__title']
    ordering = ['-created_at']