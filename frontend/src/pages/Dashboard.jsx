import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyListings, getMyBids, getHostelBids, respondToBid, createHostel, uploadHostelImages, deleteHostel, getMyFavorites, initiatePayment } from "../utils/api";
import Navbar from "../components/Navbar";
import { Home, Plus, Clock, CheckCircle, XCircle, ArrowRight, Heart } from "lucide-react";

// ─── STUDENT DASHBOARD ───────────────────────────────────────
function StudentDashboard() {
  const [bids, setBids] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bids");
  const [payingBidId, setPayingBidId] = useState(null);

  useEffect(() => {
    getMyBids()
      .then((res) => setBids(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    getMyFavorites()
      .then((res) => setFavorites(res.data))
      .catch(console.error);
  }, []);

  const handlePayNow = async (bidId) => {
    setPayingBidId(bidId);
    try {
      const res = await initiatePayment(bidId);
      window.location.href = res.data.authorization_url;
    } catch (err) {
      alert(err.response?.data?.error || "Failed to initiate payment");
    } finally {
      setPayingBidId(null);
    }
  };

  const statusIcon = {
    pending: <Clock size={16} className="text-yellow-500" />,
    accepted: <CheckCircle size={16} className="text-green-500" />,
    rejected: <XCircle size={16} className="text-red-500" />,
    countered: <ArrowRight size={16} className="text-blue-500" />,
  };

  const statusStyle = {
    pending: "bg-yellow-50 text-yellow-600",
    accepted: "bg-green-50 text-green-600",
    rejected: "bg-red-50 text-red-600",
    countered: "bg-blue-50 text-blue-600",
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("bids")}
          className={`pb-3 text-sm font-medium transition border-b-2 ${
            activeTab === "bids"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          My Bids
        </button>
        <button
          onClick={() => setActiveTab("favorites")}
          className={`pb-3 text-sm font-medium transition border-b-2 ${
            activeTab === "favorites"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Saved Hostels ({favorites.length})
        </button>
      </div>

      {/* Favorites Tab */}
      {activeTab === "favorites" && (
        <div>
          {favorites.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <Heart size={48} className="text-gray-200 mx-auto mb-4" />
              <h3 className="text-gray-400 font-medium">No saved hostels yet</h3>
              <p className="text-gray-300 text-sm mt-1 mb-4">Bookmark hostels you like while browsing</p>
              <Link to="/hostels" className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                Browse Hostels
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((fav) => (
                <Link
                  key={fav.id}
                  to={`/hostels/${fav.hostel.id}`}
                  className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition overflow-hidden"
                >
                  <div className="bg-blue-50 h-40 flex items-center justify-center">
                    {fav.hostel.images && fav.hostel.images.length > 0 ? (
                      <img
                        src={fav.hostel.images[0].image}
                        alt={fav.hostel.title}
                        className="w-full h-full object-contain bg-gray-50"
                      />
                    ) : (
                      <Home size={36} className="text-blue-200" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-1">{fav.hostel.title}</h3>
                    <p className="text-gray-500 text-sm mb-2">{fav.hostel.location}</p>
                    <p className="text-blue-600 font-bold">₦{Number(fav.hostel.price).toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bids Tab */}
      {activeTab === "bids" && (
        <div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                  <div className="bg-gray-200 h-4 rounded w-1/2 mb-3" />
                  <div className="bg-gray-200 h-3 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : bids.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <Home size={48} className="text-gray-200 mx-auto mb-4" />
              <h3 className="text-gray-400 font-medium">No bids yet</h3>
              <p className="text-gray-300 text-sm mt-1 mb-4">Start browsing hostels and place your first bid</p>
              <Link to="/hostels" className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                Browse Hostels
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => (
                <div key={bid.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{bid.hostel.title}</h3>
                      <p className="text-gray-500 text-sm">{bid.hostel.location}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium capitalize ${statusStyle[bid.status]}`}>
                      {statusIcon[bid.status]}
                      {bid.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-gray-400">Your Bid</p>
                      <p className="font-bold text-blue-600">₦{Number(bid.amount).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Listed Price</p>
                      <p className="font-medium text-gray-700">₦{Number(bid.hostel.price).toLocaleString()}</p>
                    </div>
                    {bid.counter_amount && (
                      <div>
                        <p className="text-gray-400">Counter Offer</p>
                        <p className="font-bold text-green-600">₦{Number(bid.counter_amount).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {bid.message && (
                    <p className="text-gray-400 text-sm mt-3 italic">"{bid.message}"</p>
                  )}
                  {bid.counter_message && (
                    <p className="text-green-600 text-sm mt-2 italic">Landlord: "{bid.counter_message}"</p>
                  )}

                  {(bid.status === "accepted" || bid.status === "countered") && (
                    <button
                      onClick={() => handlePayNow(bid.id)}
                      disabled={payingBidId === bid.id}
                      className="w-full bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-green-700 transition mt-3 disabled:opacity-50"
                    >
                      {payingBidId === bid.id ? "Processing..." : `Pay Now - ₦${Number(bid.counter_amount || bid.amount).toLocaleString()}`}
                    </button>
                  )}

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                    <p className="text-xs text-gray-300">
                      {new Date(bid.created_at).toLocaleDateString()}
                    </p>
                    <Link to={`/hostels/${bid.hostel.id}`} className="text-blue-600 text-sm hover:underline">
                      View Hostel →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CREATE LISTING FORM ─────────────────────────────────────
function CreateListingForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "", description: "", category: "self_contain",
    price: "", location: "", address: "", amenities: ""
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const amenitiesArray = form.amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const res = await createHostel({ ...form, amenities: amenitiesArray });
      console.log("Hostel created:", res.data);
      const hostelId = res.data.id;
      console.log("Hostel ID:", hostelId);
      
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => formData.append("images", img));
        console.log("Uploading images to hostel:", hostelId);
        const uploadRes = await uploadHostelImages(hostelId, formData);
        console.log("Upload response:", uploadRes.data);
      }

      onCreated();
      onClose();
    } catch (err) {
      setError("Failed to create listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">New Listing</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              placeholder="e.g. Sunshine Hostel"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              placeholder="Describe your hostel..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="self_contain">Self Contain</option>
                <option value="shared_room">Shared Room</option>
                <option value="single_room">Single Room</option>
                <option value="2_bedroom">2 Bedroom</option>
                <option value="3_bedroom">3 Bedroom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦/year)</label>
              <input
                type="number"
                placeholder="e.g. 150000"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              placeholder="e.g. Abuja"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
            <input
              type="text"
              placeholder="e.g. 12 University Road, Gwagwalada"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amenities <span className="text-gray-400 font-normal">(comma separated)</span>
            </label>
            <input
              type="text"
              placeholder="WiFi, 24/7 Power, Running Water, Security"
              value={form.amenities}
              onChange={(e) => setForm({ ...form, amenities: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hostel Images <span className="text-gray-400 font-normal">(optional, max 5)</span>
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages(Array.from(e.target.files).slice(0, 5))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {images.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">{images.length} image(s) selected</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-500 font-medium py-3 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── LANDLORD DASHBOARD ──────────────────────────────────────
function LandlordDashboard() {
  const [listings, setListings] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [respondingBid, setRespondingBid] = useState(null);
  const [uploadingHostel, setUploadingHostel] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [addImagesLoading, setAddImagesLoading] = useState(false);

  const fetchListings = () => {
    getMyListings()
      .then((res) => setListings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleAddImages = async (hostelId) => {
    if (newImages.length === 0) return;
    setAddImagesLoading(true);
    try {
      const formData = new FormData();
      newImages.forEach((img) => formData.append("images", img));
      await uploadHostelImages(hostelId, formData);
      setUploadingHostel(null);
      setNewImages([]);
      fetchListings();
    } catch (err) {
      console.error(err);
      alert("Failed to upload images");
    } finally {
      setAddImagesLoading(false);
    }
  };

  const handleDeleteListing = async (hostelId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      await deleteHostel(hostelId);
      fetchListings();
      if (selectedHostel === hostelId) {
        setSelectedHostel(null);
        setBids([]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete listing");
    }
  };

  const fetchBids = async (hostelId) => {
    setSelectedHostel(hostelId);
    try {
      const res = await getHostelBids(hostelId);
      setBids(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRespond = async (bidId, status, counterAmount, counterMessage) => {
    try {
      await respondToBid(bidId, {
        status,
        counter_amount: counterAmount || null,
        counter_message: counterMessage || null,
      });
      fetchBids(selectedHostel);
      setRespondingBid(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">My Listings</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium"
        >
          <Plus size={16} />
          New Listing
        </button>
      </div>

      {showForm && (
        <CreateListingForm
          onClose={() => setShowForm(false)}
          onCreated={fetchListings}
        />
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Listings */}
        <div className="space-y-4">
          {loading ? (
            [1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="bg-gray-200 h-4 rounded w-1/2 mb-3" />
                <div className="bg-gray-200 h-3 rounded w-1/3" />
              </div>
            ))
          ) : listings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <Home size={48} className="text-gray-200 mx-auto mb-4" />
              <h3 className="text-gray-400 font-medium">No listings yet</h3>
              <p className="text-gray-300 text-sm mt-1 mb-4">Create your first hostel listing</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
              >
                Create Listing
              </button>
            </div>
          ) : (
            listings.map((hostel) => (
                <div
                key={hostel.id}
                className={`bg-white rounded-2xl border cursor-pointer transition p-6 ${
                  selectedHostel === hostel.id
                    ? "border-blue-500 shadow-md"
                    : "border-gray-100 hover:shadow-sm"
                }`}
              >
                <div onClick={() => fetchBids(hostel.id)}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{hostel.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      hostel.status === "available"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    }`}>
                      {hostel.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-2">{hostel.location}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600 font-bold">₦{Number(hostel.price).toLocaleString()}</span>
                    <span className="text-xs text-gray-400">Click to view bids</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadingHostel(hostel.id);
                    }}
                    className="text-blue-600 text-xs font-medium hover:underline"
                  >
                    Add Images
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteListing(hostel.id);
                    }}
                    className="text-red-500 text-xs font-medium hover:underline"
                  >
                    Delete Listing
                  </button>
                </div>

                {uploadingHostel === hostel.id && (
                  <div onClick={(e) => e.stopPropagation()} className="mt-3 pt-3 border-t border-gray-50">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setNewImages(Array.from(e.target.files).slice(0, 5))}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddImages(hostel.id)}
                        disabled={addImagesLoading}
                        className="bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {addImagesLoading ? "Uploading..." : "Upload"}
                      </button>
                      <button
                        onClick={() => setUploadingHostel(null)}
                        className="border border-gray-200 text-gray-500 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Bids Panel */}
        <div>
          {!selectedHostel ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center py-20">
              <p className="text-gray-400 text-sm">Select a listing to view its bids</p>
            </div>
          ) : bids.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center py-20">
              <p className="text-gray-400 text-sm">No bids on this listing yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">
                Bids ({bids.length})
              </h3>
              {bids.map((bid) => (
                <div key={bid.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-gray-800">{bid.student.full_name}</p>
                      <p className="text-gray-400 text-xs">{bid.student.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                      bid.status === "pending" ? "bg-yellow-50 text-yellow-600" :
                      bid.status === "accepted" ? "bg-green-50 text-green-600" :
                      bid.status === "rejected" ? "bg-red-50 text-red-600" :
                      "bg-blue-50 text-blue-600"
                    }`}>
                      {bid.status}
                    </span>
                  </div>

                  <p className="text-blue-600 font-bold text-lg mb-2">
                    ₦{Number(bid.amount).toLocaleString()}
                  </p>

                  {bid.message && (
                    <p className="text-gray-400 text-sm italic mb-3">"{bid.message}"</p>
                  )}

                  {bid.status === "pending" && (
                    <>
                      {respondingBid === bid.id ? (
                        <BidResponseForm
                          bid={bid}
                          onRespond={handleRespond}
                          onCancel={() => setRespondingBid(null)}
                        />
                      ) : (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleRespond(bid.id, "accepted")}
                            className="flex-1 bg-green-600 text-white text-sm font-medium py-2 rounded-xl hover:bg-green-700 transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => setRespondingBid(bid.id)}
                            className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-xl hover:bg-blue-700 transition"
                          >
                            Counter
                          </button>
                          <button
                            onClick={() => handleRespond(bid.id, "rejected")}
                            className="flex-1 bg-red-50 text-red-600 text-sm font-medium py-2 rounded-xl hover:bg-red-100 transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BID RESPONSE FORM ───────────────────────────────────────
function BidResponseForm({ bid, onRespond, onCancel }) {
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");

  return (
    <div className="mt-3 space-y-3 border-t border-gray-50 pt-3">
      <input
        type="number"
        placeholder="Counter amount (₦)"
        value={counterAmount}
        onChange={(e) => setCounterAmount(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        placeholder="Message to student..."
        value={counterMessage}
        onChange={(e) => setCounterMessage(e.target.value)}
        rows={2}
        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onRespond(bid.id, "countered", counterAmount, counterMessage)}
          className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-xl hover:bg-blue-700 transition"
        >
          Send Counter
        </button>
        <button
          onClick={onCancel}
          className="flex-1 border border-gray-200 text-gray-500 text-sm font-medium py-2 rounded-xl hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {user?.full_name?.split(" ")[0]}! 
          </h1>
          <p className="text-gray-500 mt-1 capitalize">
            {user?.role} Dashboard
          </p>
        </div>

        {user?.role === "landlord" ? <LandlordDashboard /> : <StudentDashboard />}
      </div>
    </div>
  );
}