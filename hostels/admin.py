from django.contrib import admin
from .models import Hostel, HostelImage, HostelReview, Favorite


@admin.register(Hostel)
class HostelAdmin(admin.ModelAdmin):
    list_display = ['title', 'landlord', 'location', 'price', 'category', 'status', 'is_verified', 'created_at']
    list_filter = ['status', 'category', 'is_verified']
    search_fields = ['title', 'location', 'landlord__full_name']
    ordering = ['-created_at']
    actions = ['verify_hostels', 'unverify_hostels']

    def verify_hostels(self, request, queryset):
        queryset.update(is_verified=True)
        self.message_user(request, "Selected hostels have been verified.")
    verify_hostels.short_description = "Verify selected hostels"

    def unverify_hostels(self, request, queryset):
        queryset.update(is_verified=False)
        self.message_user(request, "Selected hostels have been unverified.")
    unverify_hostels.short_description = "Unverify selected hostels"


@admin.register(HostelImage)
class HostelImageAdmin(admin.ModelAdmin):
    list_display = ['hostel', 'is_main', 'uploaded_at']


@admin.register(HostelReview)
class HostelReviewAdmin(admin.ModelAdmin):
    list_display = ['hostel', 'student', 'rating', 'created_at']
    list_filter = ['rating']


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['student', 'hostel', 'created_at']