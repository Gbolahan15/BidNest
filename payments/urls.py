from django.urls import path
from .views import InitiatePaymentView, VerifyPaymentView, MyBookingsView

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='initiate-payment'),
    path('verify/', VerifyPaymentView.as_view(), name='verify-payment'),
    path('my-bookings/', MyBookingsView.as_view(), name='my-bookings'),
]