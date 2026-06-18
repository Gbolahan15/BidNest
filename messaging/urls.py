from django.urls import path
from .views import GetOrCreateConversationView, ConversationMessagesView, MyConversationsView

urlpatterns = [
    path('', MyConversationsView.as_view(), name='conversations'),
    path('with/<int:user_id>/', GetOrCreateConversationView.as_view(), name='get-or-create-conversation'),
    path('<int:conversation_id>/messages/', ConversationMessagesView.as_view(), name='conversation-messages'),
]