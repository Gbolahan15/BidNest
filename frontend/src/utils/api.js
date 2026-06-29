import axios from "axios";

const API = axios.create({
  baseURL: "https://bidnest-n8qu.onrender.com/api",
});

// Automatically attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerUser = (data) => API.post("/users/register/", data);
export const loginUser = (data) => API.post("/users/login/", data);
export const getProfile = () => API.get("/users/profile/");
export const updateProfile = (data) => API.put("/users/profile/", data);
export const googleAuth = (data) => API.post("/users/google/", data);

// Hostels
export const getHostels = (params) => API.get("/hostels/", { params });
export const getHostel = (id) => API.get(`/hostels/${id}/`);
export const createHostel = (data) => API.post("/hostels/", data);
export const updateHostel = (id, data) => API.put(`/hostels/${id}/`, data);
export const deleteHostel = (id) => API.delete(`/hostels/${id}/`);
export const getMyListings = () => API.get("/hostels/my-listings/");
export const uploadHostelImages = (hostelId, formData) => API.post(`/hostels/${hostelId}/images/`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Bids
export const placeBid = (data) => API.post("/bids/", data);
export const getMyBids = () => API.get("/bids/my-bids/");
export const getHostelBids = (hostelId) => API.get(`/bids/hostel/${hostelId}/`);
export const respondToBid = (bidId, data) => API.put(`/bids/${bidId}/respond/`, data);

// Roommates
export const getRoommateGroups = (hostelId) => API.get("/roommates/", { params: { hostel: hostelId } });
export const createRoommateGroup = (data) => API.post("/roommates/", data);
export const joinRoommateGroup = (groupId) => API.post(`/roommates/${groupId}/join/`);
export const respondToJoinRequest = (memberId, status) => API.put(`/roommates/requests/${memberId}/respond/`, { status });
export const getMyRoommateGroups = () => API.get("/roommates/my-groups/");

// Messaging
export const getConversations = () => API.get("/messages/");
export const getOrCreateConversation = (userId) => API.get(`/messages/with/${userId}/`);
export const getConversationMessages = (conversationId) => API.get(`/messages/${conversationId}/messages/`);
export const sendMessage = (conversationId, content) => API.post(`/messages/${conversationId}/messages/`, { content });

// Notifications
export const getNotifications = () => API.get("/notifications/");
export const markAsRead = (notificationId) => API.put(`/notifications/${notificationId}/read/`);
export const markAllAsRead = () => API.put("/notifications/mark-all-read/");

// Bookmarks or Favorites
export const toggleFavorite = (hostelId) => API.post(`/hostels/${hostelId}/favorite/`);
export const getMyFavorites = () => API.get("/hostels/my-favorites/");

// Reviews
export const submitReview = (hostelId, data) => API.post(`/hostels/${hostelId}/reviews/`, data);

export default API;