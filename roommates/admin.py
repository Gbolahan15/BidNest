from django.contrib import admin
from .models import RoommateGroup, RoommateMember


@admin.register(RoommateGroup)
class RoommateGroupAdmin(admin.ModelAdmin):
    list_display = ['title', 'hostel', 'created_by', 'max_members', 'is_full', 'created_at']
    list_filter = ['is_full']
    search_fields = ['title', 'hostel__title', 'created_by__full_name']


@admin.register(RoommateMember)
class RoommateMemberAdmin(admin.ModelAdmin):
    list_display = ['student', 'group', 'status', 'joined_at']
    list_filter = ['status']