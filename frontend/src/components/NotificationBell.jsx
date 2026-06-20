import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MessageCircle, Home, Users, CheckCircle, XCircle, ArrowRightLeft } from "lucide-react";
import { getNotifications, markAsRead, markAllAsRead } from "../utils/api";

const typeIcons = {
  new_bid: <Home size={16} className="text-blue-600" />,
  bid_accepted: <CheckCircle size={16} className="text-green-600" />,
  bid_rejected: <XCircle size={16} className="text-red-600" />,
  bid_countered: <ArrowRightLeft size={16} className="text-yellow-600" />,
  new_message: <MessageCircle size={16} className="text-blue-600" />,
  roommate_request: <Users size={16} className="text-purple-600" />,
  roommate_response: <Users size={16} className="text-purple-600" />,
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const pollingRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    pollingRef.current = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(pollingRef.current);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id);
        fetchNotifications();
      } catch (err) {
        console.error(err);
      }
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-500 hover:text-blue-600 transition p-2"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-blue-600 text-xs font-medium hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex gap-3 p-4 cursor-pointer hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${
                    !notification.is_read ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {typeIcons[notification.type] || <Bell size={16} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{notification.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{notification.message}</p>
                    <p className="text-gray-300 text-xs mt-1">{timeAgo(notification.created_at)}</p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}