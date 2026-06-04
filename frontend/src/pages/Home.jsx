import { Link } from "react-router-dom";
import { Search, Shield, MessageCircle, Star } from "lucide-react";
import Navbar from "../components/Navbar";

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-800 text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Find Your Perfect <br />
            <span className="text-blue-200">Student Hostel</span>
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            No more running around to agents and landlords. Browse, bid, and secure your hostel from the comfort of your phone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/hostels" className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition">
              Browse Hostels
            </Link>
            <Link to="/register" className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-white hover:text-blue-600 transition">
              List Your Hostel
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-10 px-4 border-b border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { value: "500+", label: "Hostels Listed" },
            { value: "2,000+", label: "Students Housed" },
            { value: "98%", label: "Satisfaction Rate" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold text-blue-600">{value}</div>
              <div className="text-gray-500 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
            Why Choose BidNest?
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Everything you need to find and secure student accommodation
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Search className="text-blue-600" size={24} />}
              title="Easy Search"
              description="Filter hostels by location, price, category and amenities in seconds."
            />
            <FeatureCard
              icon={<Star className="text-blue-600" size={24} />}
              title="Bid & Save"
              description="Place competitive bids and get the best price for your accommodation."
            />
            <FeatureCard
              icon={<MessageCircle className="text-blue-600" size={24} />}
              title="Direct Chat"
              description="Message landlords directly without going through agents."
            />
            <FeatureCard
              icon={<Shield className="text-blue-600" size={24} />}
              title="Verified Listings"
              description="All landlords are ID-verified so you never get scammed."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Hostel?</h2>
          <p className="text-blue-100 mb-8">
            Join thousands of students who found their perfect accommodation on BidNest.
          </p>
          <Link to="/register" className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition inline-block">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 px-4 text-center">
        <p className="text-sm">© 2026 BidNest. Built to solve a real problem.</p>
      </footer>
    </div>
  );
}