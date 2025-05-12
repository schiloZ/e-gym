"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CreditCard, ArrowLeft, Save, AlertCircle } from "lucide-react";

export default function PaymentEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const paymentId = params?.id;
  const [payment, setPayment] = useState({
    amount: "",
    subscription: "",
    method: "",
    status: "",
    paymentStatus: "",
    startDate: "",
    endDate: "",
    nextPaymentDate: "",
    paymentDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        setPayment({
          amount: data.amount?.toString() || "",
          subscription: data.subscription || "",
          method: data.method || "",
          status: data.status || "",
          paymentStatus: data.paymentStatus || "",
          startDate: data.startDate
            ? new Date(data.startDate).toISOString().split("T")[0]
            : "",
          endDate: data.endDate
            ? new Date(data.endDate).toISOString().split("T")[0]
            : "",
          nextPaymentDate: data.nextPaymentDate
            ? new Date(data.nextPaymentDate).toISOString().split("T")[0]
            : "",
          paymentDate: data.paymentDate
            ? new Date(data.paymentDate).toISOString().split("T")[0]
            : "",
        });
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(payment.amount),
          subscription: payment.subscription,
          method: payment.method,
          status: payment.status,
          paymentStatus: payment.paymentStatus,
          startDate: payment.startDate || undefined,
          endDate: payment.endDate || undefined,
          nextPaymentDate: payment.nextPaymentDate || undefined,
          paymentDate: payment.paymentDate || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to update payment (Status: ${response.status})`
        );
      }

      const updatedPayment = await response.json();
      setSuccess("Payment updated successfully");
      setTimeout(() => router.push(`/dashboard/payments/${paymentId}`), 2000); // Redirect after 2 seconds
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message || "An error occurred while updating payment data");
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Link
            href={`/dashboard/payments/${paymentId}`}
            className="mr-3 text-green-600 hover:text-green-800"
          >
            <ArrowLeft className="h-5 sm:h-6 w-5 sm:w-6" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center text-gray-800">
              <CreditCard className="h-5 sm:h-6 w-5 sm:w-6 mr-2 text-green-600" />
              Edit Payment
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Update payment details
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
            <span>{success}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (FCFA)
            </label>
            <input
              type="number"
              value={payment.amount}
              onChange={(e) =>
                setPayment({ ...payment, amount: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subscription
            </label>
            <select
              value={payment.subscription}
              onChange={(e) =>
                setPayment({ ...payment, subscription: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={payment.method}
              onChange={(e) =>
                setPayment({ ...payment, method: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Mobile Money">Mobile Money</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={payment.status}
              onChange={(e) =>
                setPayment({ ...payment, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <select
              value={payment.paymentStatus}
              onChange={(e) =>
                setPayment({ ...payment, paymentStatus: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={payment.startDate}
              onChange={(e) =>
                setPayment({ ...payment, startDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={payment.endDate}
              onChange={(e) =>
                setPayment({ ...payment, endDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Next Payment Date
            </label>
            <input
              type="date"
              value={payment.nextPaymentDate}
              onChange={(e) =>
                setPayment({ ...payment, nextPaymentDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={payment.paymentDate}
              onChange={(e) =>
                setPayment({ ...payment, paymentDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
