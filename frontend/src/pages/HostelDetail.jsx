import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapPin, Home, Star, ArrowLeft, Wifi, Zap, Droplets, Shield, Users, Plus } from "lucide-react";
import { getHostel, placeBid, getRoommateGroups, createRoommateGroup, joinRoommateGroup } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

function AmenityIcon({ name }) {
  const icons = {
    WiFi: <Wifi size={16} />,
    "24/7 Power": <Zap size={16} />,
    "Running Water": <Droplets size={16} />,
    Security: <Shield size={16} />,
  };
  return icons[name] || <Home size={16} />;
}

export default function HostelDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [bidError, setBidError] = useState("");

  // Roommate states
  const [roommateGroups, setRoommateGroups] = useState([]);
  const [showRoommateForm, setShowRoommateForm] = useState(false);
  const [roommateForm, setRoommateForm] = useState({ title: "", description: "", max_members: 2 });
  const [roommateLoading, setRoommateLoading] = useState(false);

useEffect(() => {
    const fetchHostel = async () => {
      try {
        const res = await getHostel(id);
        setHostel(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHostel();
    fetchRoommateGroups();
  }, [id]);

  const fetchRoommateGroups = async () => {
    try {
      const res = await getRoommateGroups(id);
      setRoommateGroups(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRoommateGroup = async (e) => {
    e.preventDefault();
    setRoommateLoading(true);
    try {
      await createRoommateGroup({ ...roommateForm, hostel: id });
      setShowRoommateForm(false);
      setRoommateForm({ title: "", description: "", max_members: 2 });
      fetchRoommateGroups();
    } catch (err) {
      console.error(err);
    } finally {
      setRoommateLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await joinRoommateGroup(groupId);
      fetchRoommateGroups();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to join group");
    }
  };

const handleBid = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    setBidLoading(true);
    setBidError("");
    try {
      await placeBid({
        hostel: id,
        amount: bidAmount,
        message: bidMessage,
      });
      setBidSuccess(true);
      setBidAmount("");
      setBidMessage("");
    } catch (err) {
      const data = err.response?.data;
      if (data?.error) {
        setBidError(data.error);
      } else {
        setBidError("Failed to place bid. Please try again.");
      }
    } finally {
      setBidLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
          <div className="bg-gray-200 h-64 rounded-2xl mb-6" />
          <div className="bg-gray-200 h-8 rounded w-1/2 mb-4" />
          <div className="bg-gray-200 h-4 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20">
          <h2 className="text-gray-400 text-xl">Hostel not found</h2>
          <Link to="/hostels" className="text-blue-600 mt-4 inline-block">Back to listings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition mb-6"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back to listings</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left Column */}
          <div className="flex-1">

            {/* Image */}
            <div className="bg-blue-50 rounded-2xl h-64 flex items-center justify-center overflow-hidden mb-6">
              {hostel.images && hostel.images.length > 0 ? (
                <img
                  src={hostel.images[0].image}
                  alt={hostel.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Home size={64} className="text-blue-200" />
              )}
            </div>

            {/* Title & Status */}
            <div className="flex justify-between items-start mb-3">
              <h1 className="text-2xl font-bold text-gray-800">{hostel.title}</h1>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                hostel.status === "available"
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}>
                {hostel.status}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 text-gray-500 mb-4">
              <MapPin size={16} />
              <span className="text-sm">{hostel.address}</span>
            </div>

            {/* Price & Category */}
            <div className="flex items-center gap-4 mb-6">
              <div>
                <span className="text-blue-600 font-bold text-3xl">
                  ₦{Number(hostel.price).toLocaleString()}
                </span>
                <span className="text-gray-400 text-sm">/year</span>
              </div>
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm capitalize">
                {hostel.category.replace("_", " ")}
              </span>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <h2 className="font-semibold text-gray-800 mb-3">About this hostel</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{hostel.description}</p>
            </div>

            {/* Amenities */}
            {hostel.amenities && hostel.amenities.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
                <h2 className="font-semibold text-gray-800 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 gap-3">
                  {hostel.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 text-gray-600 text-sm">
                      <div className="text-blue-600">
                        <AmenityIcon name={amenity} />
                      </div>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Landlord Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <h2 className="font-semibold text-gray-800 mb-4">Listed by</h2>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 font-bold w-12 h-12 rounded-full flex items-center justify-center text-lg">
                  {hostel.landlord?.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{hostel.landlord?.full_name}</p>
                  <p className="text-sm text-gray-500 capitalize">{hostel.landlord?.role}</p>
                </div>
              </div>
            </div>

            {/* Roommate Finder */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  Roommate Groups
                </h2>
                {user && user.role === "student" && (
                  <button
                    onClick={() => setShowRoommateForm(!showRoommateForm)}
                    className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline"
                  >
                    <Plus size={16} />
                    Create Group
                  </button>
                )}
              </div>

              {showRoommateForm && (
                <form onSubmit={handleCreateRoommateGroup} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Group title e.g. Looking for 1 roommate"
                    value={roommateForm.title}
                    onChange={(e) => setRoommateForm({ ...roommateForm, title: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Describe what you're looking for..."
                    value={roommateForm.description}
                    onChange={(e) => setRoommateForm({ ...roommateForm, description: e.target.value })}
                    required
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600">Max members:</label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={roommateForm.max_members}
                      onChange={(e) => setRoommateForm({ ...roommateForm, max_members: e.target.value })}
                      className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={roommateLoading}
                      className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {roommateLoading ? "Creating..." : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRoommateForm(false)}
                      className="border border-gray-200 text-gray-500 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {roommateGroups.length === 0 ? (
                <p className="text-gray-400 text-sm">No roommate groups yet. Be the first to create one!</p>
              ) : (
                <div className="space-y-3">
                  {roommateGroups.map((group) => {
                    const memberRecord = group.members.find((m) => m.student.id === user?.id);
                    const isMember = memberRecord?.status === "accepted";
                    const isPending = memberRecord?.status === "pending";
                    return (
                      <div key={group.id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-800 text-sm">{group.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            group.is_full ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                          }`}>
                            {group.current_members_count}/{group.max_members} members
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm mb-2">{group.description}</p>
                        <p className="text-gray-400 text-xs mb-3">Created by {group.created_by.full_name}</p>

                        {!group.is_full && !isMember && !isPending && user?.role === "student" && (
                          <button
                            onClick={() => handleJoinGroup(group.id)}
                            className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                          >
                            Request to Join
                          </button>
                        )}
                        {isMember && (
                          <span className="text-green-600 text-xs font-medium">✓ You're a member</span>
                        )}
                        {isPending && (
                          <span className="text-yellow-600 text-xs font-medium">⏳ Request pending approval</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-4">
                Reviews {hostel.average_rating && (
                  <span className="text-yellow-500 ml-2 flex items-center gap-1 inline-flex">
                    <Star size={16} fill="currentColor" />
                    {hostel.average_rating}
                  </span>
                )}
              </h2>
              {hostel.reviews && hostel.reviews.length > 0 ? (
                <div className="space-y-4">
                  {hostel.reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800 text-sm">{review.student.full_name}</span>
                        <div className="flex text-yellow-400">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} size={12} fill="currentColor" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No reviews yet.</p>
              )}
            </div>
          </div>

          {/* Right Column — Bid Box */}
          <div className="lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <h2 className="font-semibold text-gray-800 text-lg mb-1">Place a Bid</h2>
              <p className="text-gray-400 text-sm mb-6">
                Listed at <span className="text-blue-600 font-medium">₦{Number(hostel.price).toLocaleString()}</span>
              </p>

              {bidSuccess ? (
                <div className="bg-green-50 text-green-600 px-4 py-4 rounded-xl text-sm text-center">
                   Bid placed successfully! The landlord will review and respond shortly.
                </div>
              ) : (
                <form onSubmit={handleBid} className="space-y-4">
                  {bidError && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                      {bidError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Bid Amount (₦)
                    </label>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="e.g. 120000"
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message (optional)
                    </label>
                    <textarea
                      value={bidMessage}
                      onChange={(e) => setBidMessage(e.target.value)}
                      placeholder="Introduce yourself to the landlord..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {!user ? (
                    <Link
                      to="/login"
                      className="block w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition text-center"
                    >
                      Login to Place Bid
                    </Link>
                  ) : user.role === "landlord" ? (
                    <div className="bg-gray-50 text-gray-400 px-4 py-3 rounded-xl text-sm text-center">
                      Landlords cannot place bids
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={bidLoading}
                      className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {bidLoading ? "Placing bid..." : "Place Bid"}
                    </button>
                  )}
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  Your bid will be reviewed by the landlord. You'll be notified of their response.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}