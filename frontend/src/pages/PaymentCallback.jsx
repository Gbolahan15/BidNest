import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { verifyPayment } from "../utils/api";
import Navbar from "../components/Navbar";
import { CheckCircle, XCircle, Loader } from "lucide-react";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, failed
  const [message, setMessage] = useState("");

  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (!reference) {
      setStatus("failed");
      setMessage("No payment reference found");
      return;
    }

    const verify = async () => {
      try {
        const res = await verifyPayment(reference);
        setStatus("success");
        setMessage("Your payment was successful! Your booking is confirmed.");
      } catch (err) {
        setStatus("failed");
        setMessage(err.response?.data?.error || "Payment verification failed");
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-20 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          {status === "verifying" && (
            <>
              <Loader size={48} className="text-blue-600 mx-auto mb-4 animate-spin" />
              <h1 className="text-xl font-bold text-gray-800 mb-2">Verifying Payment...</h1>
              <p className="text-gray-500 text-sm">Please wait while we confirm your payment</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-800 mb-2">Payment Successful! 🎉</h1>
              <p className="text-gray-500 text-sm mb-6">{message}</p>
              <Link
                to="/dashboard"
                className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition inline-block"
              >
                Go to Dashboard
              </Link>
            </>
          )}

          {status === "failed" && (
            <>
              <XCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-800 mb-2">Payment Failed</h1>
              <p className="text-gray-500 text-sm mb-6">{message}</p>
              <Link
                to="/dashboard"
                className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition inline-block"
              >
                Back to Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}