from django.urls import path
from .views import HostelListCreateView, HostelDetailView, HostelImageUploadView, MyHostelsView, HostelReviewView

urlpatterns = [
    path('', HostelListCreateView.as_view(), name='hostel-list'),
    path('<int:pk>/', HostelDetailView.as_view(), name='hostel-detail'),
    path('<int:pk>/images/', HostelImageUploadView.as_view(), name='hostel-images'),
    path('<int:pk>/reviews/', HostelReviewView.as_view(), name='hostel-reviews'),
    path('my-listings/', MyHostelsView.as_view(), name='my-hostels'),
]