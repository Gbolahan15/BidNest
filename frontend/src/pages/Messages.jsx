import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getConversations, getOrCreateConversation, getConversationMessages, sendMessage } from "../utils/api";
import Navbar from "../components/Navbar";
import { Send, ArrowLeft, MessageCircle } from "lucide-react";

export default function Messages() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendLoading, setSendLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (conversationId) => {
    try {
      const res = await getConversationMessages(conversationId);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Start polling when conversation is active
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      pollingRef.current = setInterval(() => {
        fetchMessages(activeConversation.id);
      }, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(pollingRef.current);
  }, [activeConversation]);

  // If userId is in URL, open that conversation directly
  useEffect(() => {
    const init = async () => {
      await fetchConversations();
      if (userId) {
        try {
          const res = await getOrCreateConversation(userId);
          setActiveConversation(res.data);
        } catch (err) {
          console.error(err);
        }
      }
    };
    init();
  }, [userId]);

  const handleSelectConversation = async (conversation) => {
    setActiveConversation(conversation);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;
    setSendLoading(true);
    try {
      await sendMessage(activeConversation.id, newMessage);
      setNewMessage("");
      fetchMessages(activeConversation.id);
      fetchConversations();
    } catch (err) {
      console.error(err);
    } finally {
      setSendLoading(false);
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find((p) => p.id !== user?.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Messages</h1>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ height: "600px" }}>
          <div className="flex h-full">

            {/* Conversations List */}
            <div className="w-80 border-r border-gray-100 flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-700 text-sm">Conversations</h2>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="bg-gray-200 h-3 rounded w-3/4" />
                          <div className="bg-gray-200 h-2 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageCircle size={32} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No conversations yet</p>
                    <p className="text-gray-300 text-xs mt-1">Start a chat from a hostel page</p>
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const other = getOtherParticipant(conversation);
                    const isActive = activeConversation?.id === conversation.id;
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition ${
                          isActive ? "bg-blue-50 border-r-2 border-blue-600" : ""
                        }`}
                      >
                        <div className="bg-blue-100 text-blue-600 font-bold w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0">
                          {other?.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">{other?.full_name}</p>
                          <p className="text-gray-400 text-xs truncate capitalize">{other?.role}</p>
                          {conversation.last_message && (
                            <p className="text-gray-400 text-xs truncate mt-0.5">
                              {conversation.last_message.content}
                            </p>
                          )}
                        </div>
                        {conversation.unread_count > 0 && (
                          <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {!activeConversation ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle size={48} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400">Select a conversation to start chatting</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="text-gray-400 hover:text-gray-600 transition"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div className="bg-blue-100 text-blue-600 font-bold w-9 h-9 rounded-full flex items-center justify-center text-sm">
                      {getOtherParticipant(activeConversation)?.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {getOtherParticipant(activeConversation)?.full_name}
                      </p>
                      <p className="text-gray-400 text-xs capitalize">
                        {getOtherParticipant(activeConversation)?.role}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-gray-300 text-sm">No messages yet. Say hello! 👋</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMine = message.sender.id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                              isMine
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-gray-100 text-gray-800 rounded-bl-none"
                            }`}>
                              <p>{message.content}</p>
                              <p className={`text-xs mt-1 ${isMine ? "text-blue-200" : "text-gray-400"}`}>
                                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-100">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={sendLoading || !newMessage.trim()}
                        className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        <Send size={18} />
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}