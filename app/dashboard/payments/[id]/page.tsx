"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CreditCard, ArrowLeft, AlertCircle } from "lucide-react";

export default function PaymentDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const paymentId = params.id;
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  console.log("Payment ID from params:", paymentId);

  // Fetch payment data on mount
  useEffect(() => {
    const fetchPayment = async () => {
      if (status === "loading") return;
      if (!session) {
        router.push("/");
        return;
      }

      if (!paymentId || typeof paymentId !== "string") {
        setError("Invalid or missing payment ID");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/payments/${paymentId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `Failed to fetch payment data (Status: ${response.status})`
          );
        }

        const data = await response.json();
        setPayment(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          err.message || "An error occurred while fetching payment data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [session, status, router, paymentId]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        Loading...
      </div>
    );
  }

  if (!session) {
    return null; // Redirect handled in useEffect
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-center">
          <p className="font-medium">Payment not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Link
            href="/dashboard/payments"
            className="mr-3 text-green-600 hover:text-green-800"
          >
            <ArrowLeft className="h-5 sm:h-6 w-5 sm:w-6" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center text-gray-800">
              <CreditCard className="h-5 sm:h-6 w-5 sm:w-6 mr-2 text-green-600" />
              Payment Details
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {payment.subscription} Subscription for {payment.client.name}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
          Payment Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Client</p>
            <p className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">👤</span> {payment.client.name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Amount</p>
            <p className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">💰</span>{" "}
              {payment.amount.toLocaleString()} FCFA
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Subscription</p>
            <p className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">📋</span> {payment.subscription}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Payment Method</p>
            <p className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">💳</span> {payment.method}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">🔔</span>
              <span
                className={
                  payment.paymentStatus === "Paid"
                    ? "text-green-600"
                    : payment.paymentStatus === "Unpaid"
                    ? "text-yellow-600"
                    : "text-red-600"
                }
              >
                {payment.paymentStatus || "N/A"}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Payment Date</p>
            <p className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">📅</span>{" "}
              {payment.paymentDate
                ? new Date(payment.paymentDate).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">📅</span>{" "}
              {new Date(payment.startDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">End Date</p>
            <p className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">📅</span>{" "}
              {new Date(payment.endDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Next Payment Date</p>
            <p className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">⏳</span>{" "}
              {payment.nextPaymentDate
                ? new Date(payment.nextPaymentDate).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Created At</p>
            <p className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">📅</span>{" "}
              {new Date(payment.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Updated At</p>
            <p className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">📅</span>{" "}
              {new Date(payment.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
