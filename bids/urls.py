from django.urls import path
from .views import PlaceBidView, MyBidsView, HostelBidsView, RespondToBidView

urlpatterns = [
    path('', PlaceBidView.as_view(), name='place-bid'),
    path('my-bids/', MyBidsView.as_view(), name='my-bids'),
    path('hostel/<int:hostel_id>/', HostelBidsView.as_view(), name='hostel-bids'),
    path('<int:bid_id>/respond/', RespondToBidView.as_view(), name='respond-bid'),
]