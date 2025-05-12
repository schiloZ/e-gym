"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  CreditCard,
  Search,
  ArrowRight,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch payments on mount
  useEffect(() => {
    const fetchPayments = async () => {
      if (status === "loading") return;
      if (!session) {
        router.push("/");
        return;
      }

      try {
        const response = await fetch("/api/payments");
        const data = await response.json();
        setPayments(data);
        setFilteredPayments(data);
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [session, status, router]);

  // Handle search
  useEffect(() => {
    const filtered = payments.filter(
      (payment) =>
        payment.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.subscription
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        payment.amount.toString().includes(searchQuery) ||
        payment.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPayments(filtered);
  }, [searchQuery, payments]);

  // Handle delete payment
  const handleDelete = async (paymentId) => {
    if (confirm("Are you sure you want to delete this payment?")) {
      try {
        await fetch(`/api/payments/${paymentId}`, {
          method: "DELETE",
        });
        setPayments(payments.filter((payment) => payment.id !== paymentId));
        setFilteredPayments(
          filteredPayments.filter((payment) => payment.id !== paymentId)
        );
      } catch (error) {
        console.error("Error deleting payment:", error);
      }
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-green-600 to-green-800 p-4 sm:p-6 rounded-xl text-white shadow-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
            <CreditCard className="h-5 sm:h-6 w-5 sm:w-6 mr-2" />
            Payments
          </h1>
          <p className="text-sm sm:text-base text-green-100">
            Track your financial transactions
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard/payments/new"
            className="bg-white text-green-600 hover:bg-green-50 py-2 px-3 sm:px-4 rounded-lg font-medium flex items-center gap-2 text-sm sm:text-base transition shadow-md w-full sm:w-auto"
          >
            <CreditCard className="h-4 sm:h-5 w-4 sm:w-5" />
            New Payment
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-gray-50 text-sm sm:text-base"
            placeholder="Search by client, subscription, amount, or status..."
          />
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md overflow-hidden">
        <div className="space-y-3 sm:space-y-4">
          {filteredPayments.length === 0 ? (
            <div className="text-gray-500 text-center py-8 sm:py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <CreditCard className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-sm sm:text-base">
                No payments found
              </p>
              <p className="text-xs sm:text-sm mt-1">
                Use the search bar or add a new payment to get started
              </p>
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition border border-gray-100 hover:border-green-200"
              >
                <div className="mb-2 sm:mb-0">
                  <p className="font-semibold text-gray-800 text-sm sm:text-base">
                    {payment.client.name}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                      <span className="text-green-500">💰</span>{" "}
                      {payment.amount.toLocaleString()} FCFA
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                      <span className="text-green-500">📅</span>{" "}
                      {new Date(payment.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <span className="text-green-500">🔔</span> Status:{" "}
                    {payment.status}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  <Link
                    href={`/dashboard/payments/${payment.id}`}
                    className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 transition w-full sm:w-auto"
                  >
                    <Eye className="h-3 sm:h-4 w-3 sm:w-4" />
                    View
                  </Link>
                  <Link
                    href={`/dashboard/payments/${payment.id}/edit`}
                    className="text-yellow-600 hover:text-yellow-800 bg-yellow-50 hover:bg-yellow-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 transition w-full sm:w-auto"
                  >
                    <Edit className="h-3 sm:h-4 w-3 sm:w-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(payment.id)}
                    className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 transition w-full sm:w-auto"
                  >
                    <Trash2 className="h-3 sm:h-4 w-3 sm:w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {filteredPayments.length > 0 && (
          <div className="mt-3 sm:mt-4 text-center">
            <Link
              href="/dashboard/payments"
              className="text-green-600 hover:text-green-800 text-xs sm:text-sm font-medium inline-flex items-center"
            >
              View all payments
              <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4 ml-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
