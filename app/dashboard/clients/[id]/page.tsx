"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  ArrowLeft,
  CreditCard,
  Calendar,
  AlertCircle,
  Eye,
} from "lucide-react";

export default function ClientDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id; // Use params.id instead of router.asPath
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  console.log("Client ID from params:", clientId); // Debug log

  // Fetch client data and payments on mount
  useEffect(() => {
    const fetchClient = async () => {
      if (status === "loading") return;
      if (!session) {
        router.push("/");
        return;
      }

      // Check if clientId is available
      if (!clientId || typeof clientId !== "string") {
        setError("Invalid or missing client ID");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/clients/${clientId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch client data");
        }

        setClient(data);
      } catch (err) {
        setError(err.message || "An error occurred while fetching client data");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [session, status, router, clientId]);

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

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-center">
          <p className="font-medium">Client not found</p>
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
            href="/dashboard/clients"
            className="mr-3 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-5 sm:h-6 w-5 sm:w-6" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center text-gray-800">
              <User className="h-5 sm:h-6 w-5 sm:w-6 mr-2 text-blue-600" />
              {client.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Client Details & Payment Status
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href={`/dashboard/clients/${clientId}/edit`}
            className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 py-2 px-3 sm:px-4 rounded-lg font-medium flex items-center gap-2 text-sm sm:text-base transition shadow-md w-full sm:w-auto"
          >
            <User className="h-4 sm:h-5 w-4 sm:w-5" />
            Edit Client
          </Link>
          <Link
            href="/dashboard/payments/new"
            className="bg-green-50 text-green-600 hover:bg-green-100 py-2 px-3 sm:px-4 rounded-lg font-medium flex items-center gap-2 text-sm sm:text-base transition shadow-md w-full sm:w-auto"
          >
            <CreditCard className="h-4 sm:h-5 w-4 sm:w-5" />
            Add Payment
          </Link>
        </div>
      </div>

      {/* Client Details */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
          Client Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-blue-500">✉️</span> {client.email || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-blue-500">📞</span> {client.phone || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Registration Date</p>
            <p className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-blue-500">📅</span>{" "}
              {new Date(client.registrationDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
          Payment Status
        </h2>
        {client.payments.length === 0 ? (
          <div className="text-gray-500 text-center py-8 sm:py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <CreditCard className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-sm sm:text-base">
              No payments found
            </p>
            <p className="text-xs sm:text-sm mt-1">
              Add a payment for this client to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {client.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition border border-gray-100 hover:border-green-200"
              >
                <div className="mb-2 sm:mb-0">
                  <p className="font-semibold text-gray-800 text-sm sm:text-base">
                    {payment.subscription} Subscription
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
                  {payment.nextPaymentDate && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <span className="text-green-500">⏳</span> Next Payment:{" "}
                      {new Date(payment.nextPaymentDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  <Link
                    href={`/dashboard/payments/${payment.id}`}
                    className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 transition w-full sm:w-auto"
                  >
                    <Eye className="h-3 sm:h-4 w-3 sm:w-4" />
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
