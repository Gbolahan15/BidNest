import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Filter, Home, Heart } from "lucide-react";
import { getHostels, toggleFavorite } from "../utils/api";
import Navbar from "../components/Navbar";

function HostelCard({ hostel, onToggleFavorite }) {
  const [isFavorited, setIsFavorited] = useState(hostel.is_favorited);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFavoriteLoading(true);
    try {
      const res = await toggleFavorite(hostel.id);
      setIsFavorited(res.data.favorited);
    } catch (err) {
      console.error(err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <Link to={`/hostels/${hostel.id}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden">
      {/* Image */}
      <div className="bg-blue-50 h-48 flex items-center justify-center relative">
        {hostel.images && hostel.images.length > 0 ? (
          <img
            src={hostel.images[0].image}
            alt={hostel.title}
            className="w-full h-full object-contain bg-gray-50"
          />
        ) : (
          <Home size={48} className="text-blue-200" />
        )}
        <button
          onClick={handleFavoriteClick}
          disabled={favoriteLoading}
          className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-sm hover:scale-110 transition"
        >
          <Heart
            size={18}
            className={isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800 text-lg leading-tight">{hostel.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            hostel.status === "available"
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          }`}>
            {hostel.status}
          </span>
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
          <MapPin size={14} />
          <span>{hostel.location}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-blue-600 font-bold text-xl">
              ₦{Number(hostel.price).toLocaleString()}
            </span>
            <span className="text-gray-400 text-sm">/year</span>
          </div>
          <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full capitalize">
            {hostel.category.replace("_", " ")}
          </span>
        </div>

        {hostel.amenities && hostel.amenities.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {hostel.amenities.slice(0, 3).map((a) => (
              <span key={a} className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded-full">
                {a}
              </span>
            ))}
            {hostel.amenities.length > 3 && (
              <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded-full">
                +{hostel.amenities.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function Hostels() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    min_price: "",
    max_price: "",
    location: "",
  });

  const fetchHostels = async () => {
    setLoading(true);
    try {
      const params = { search, ...filters };
      const res = await getHostels(params);
      setHostels(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHostels();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Search Header */}
      <div className="bg-blue-600 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-white text-3xl font-bold mb-6 text-center">
            Find Your Hostel
          </h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex items-center bg-white rounded-xl px-4 gap-2">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 py-3 text-sm focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Filters Sidebar */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter size={18} className="text-blue-600" />
                <h2 className="font-semibold text-gray-800">Filters</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Abuja"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    <option value="self_contain">Self Contain</option>
                    <option value="shared_room">Shared Room</option>
                    <option value="single_room">Single Room</option>
                    <option value="2_bedroom">2 Bedroom</option>
                    <option value="3_bedroom">3 Bedroom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₦)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={filters.min_price}
                    onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₦)</label>
                  <input
                    type="number"
                    placeholder="e.g. 300000"
                    value={filters.max_price}
                    onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={fetchHostels}
                  className="w-full bg-blue-600 text-white font-semibold py-2 rounded-xl hover:bg-blue-700 transition text-sm"
                >
                  Apply Filters
                </button>

                <button
                  onClick={() => {
                    setFilters({ category: "", min_price: "", max_price: "", location: "" });
                    setSearch("");
                  }}
                  className="w-full border border-gray-200 text-gray-500 font-medium py-2 rounded-xl hover:bg-gray-50 transition text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Hostel Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-500 text-sm">
                {loading ? "Loading..." : `${hostels.length} hostel${hostels.length !== 1 ? "s" : ""} found`}
              </p>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                    <div className="bg-gray-200 h-48" />
                    <div className="p-4 space-y-3">
                      <div className="bg-gray-200 h-4 rounded w-3/4" />
                      <div className="bg-gray-200 h-3 rounded w-1/2" />
                      <div className="bg-gray-200 h-4 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hostels.length === 0 ? (
              <div className="text-center py-20">
                <Home size={48} className="text-gray-200 mx-auto mb-4" />
                <h3 className="text-gray-400 font-medium">No hostels found</h3>
                <p className="text-gray-300 text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {hostels.map((hostel) => (
                  <HostelCard key={hostel.id} hostel={hostel} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}