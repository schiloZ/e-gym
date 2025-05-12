"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  ArrowLeft,
  Calendar,
  DollarSign,
  AlertCircle,
} from "lucide-react";

export default function NewPaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    clientEmail: "",
    amount: "",
    subscription: "Monthly",
    method: "Cash",
    status: "Pending",
    startDate: new Date().toISOString().split("T")[0], // Default to today
    endDate: "",
    nextPaymentDate: "",
    paymentDate: "",
    paymentStatus: "Unpaid",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingClients, setLoadingClients] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      if (status === "loading") return;
      if (!session) {
        router.push("/");
        return;
      }

      try {
        const response = await fetch("/api/clients");
        const data = await response.json();
        setClients(data);
      } catch (err) {
        setError("Failed to load clients. Please try again.");
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, [session, status, router]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    // Validate required fields
    if (!formData.clientEmail || !formData.amount) {
      setError("Please select a client and enter an amount.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientEmail: formData.clientEmail,
          amount: parseInt(formData.amount),
          subscription: formData.subscription,
          method: formData.method,
          status: formData.status,
          startDate: formData.startDate
            ? new Date(formData.startDate).toISOString()
            : null,
          endDate: formData.endDate
            ? new Date(formData.endDate).toISOString()
            : null,
          nextPaymentDate: formData.nextPaymentDate
            ? new Date(formData.nextPaymentDate).toISOString()
            : null,
          paymentDate: formData.paymentDate
            ? new Date(formData.paymentDate).toISOString()
            : null,
          paymentStatus: formData.paymentStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to record payment");
      }

      setSuccess("Payment recorded successfully!");
      // Redirect to payments list after a short delay
      setTimeout(() => router.push("/dashboard/payments"), 1500);
    } catch (err) {
      setError(err.message || "An error occurred while recording the payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loadingClients) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        Loading...
      </div>
    );
  }

  if (!session) {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
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
                Record New Payment
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Add a new payment for a client
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Success/Error Messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm sm:text-base">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm sm:text-base">
                <CreditCard className="h-5 w-5" />
                <span>{success}</span>
              </div>
            )}

            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <select
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                className="w-full p-2 sm:p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-sm sm:text-base"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.email}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (FCFA)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-sm sm:text-base"
                  placeholder="Enter amount"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            {/* Subscription */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscription
              </label>
              <select
                name="subscription"
                value={formData.subscription}
                onChange={handleChange}
                className="w-full p-2 sm:p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-sm sm:text-base"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="w-full p-2 sm:p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-sm sm:text-base"
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Money">Mobile Money</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 sm:p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-sm sm:text-base"
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                className="w-full p-2 sm:p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-sm sm:text-base"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-sm sm:text-base"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Next Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Payment Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                <input
                  type="date"
                  name="nextPaymentDate"
                  value={formData.nextPaymentDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full sm:w-auto bg-green-600 text-white py-2 sm:py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-md text-sm sm:text-base ${
                  submitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <CreditCard className="h-4 sm:h-5 w-4 sm:w-5" />
                {submitting ? "Recording..." : "Record Payment"}
              </button>
              <Link
                href="/dashboard/payments"
                className="w-full sm:w-auto bg-gray-200 text-gray-700 py-2 sm:py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-300 transition shadow-md text-sm sm:text-base text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
