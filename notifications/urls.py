from django.urls import path
from .views import MyNotificationsView, MarkAsReadView, MarkAllAsReadView

urlpatterns = [
    path('', MyNotificationsView.as_view(), name='notifications'),
    path('mark-all-read/', MarkAllAsReadView.as_view(), name='mark-all-read'),
    path('<int:notification_id>/read/', MarkAsReadView.as_view(), name='mark-read'),
]