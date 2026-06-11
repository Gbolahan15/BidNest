from django.urls import path
from .views import (RoommateGroupListCreateView, JoinRoommateGroupView,RespondToJoinRequestView, MyRoommateGroupsView)

urlpatterns = [
    path('', RoommateGroupListCreateView.as_view(), name='roommate-groups'),
    path('my-groups/', MyRoommateGroupsView.as_view(), name='my-roommate-groups'),
    path('<int:group_id>/join/', JoinRoommateGroupView.as_view(), name='join-roommate-group'),
    path('requests/<int:member_id>/respond/', RespondToJoinRequestView.as_view(), name='respond-join-request'),
]