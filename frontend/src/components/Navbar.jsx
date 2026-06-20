import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, Home, Search, LayoutDashboard, MessageCircle } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-blue-600 text-white font-bold text-xl px-3 py-1 rounded-lg">
              BN
            </div>
            <span className="font-bold text-xl text-gray-800">BidNest</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition">
              <Home size={18} />
              <span className="hidden sm:block text-sm">Home</span>
            </Link>
            <Link to="/hostels" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition">
              <Search size={18} />
              <span className="hidden sm:block text-sm">Browse</span>
            </Link>
            {user && (
              <Link to="/dashboard" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition">
                <LayoutDashboard size={18} />
                <span className="hidden sm:block text-sm">Dashboard</span>
              </Link>
            )}
            {user && (
              <Link to="/messages" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition">
                <MessageCircle size={18} />
                <span className="hidden sm:block text-sm">Messages</span>
              </Link>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-800">{user.full_name}</span>
                  <span className="text-xs text-blue-600 capitalize">{user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium transition text-sm">
                  Login
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}