import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
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

// Hostels
export const getHostels = (params) => API.get("/hostels/", { params });
export const getHostel = (id) => API.get(`/hostels/${id}/`);
export const createHostel = (data) => API.post("/hostels/", data);
export const updateHostel = (id, data) => API.put(`/hostels/${id}/`, data);
export const deleteHostel = (id) => API.delete(`/hostels/${id}/`);
export const getMyListings = () => API.get("/hostels/my-listings/");

export default API;

// Bids
export const placeBid = (data) => API.post("/bids/", data);
export const getMyBids = () => API.get("/bids/my-bids/");
export const getHostelBids = (hostelId) => API.get(`/bids/hostel/${hostelId}/`);
export const respondToBid = (bidId, data) => API.put(`/bids/${bidId}/respond/`, data);