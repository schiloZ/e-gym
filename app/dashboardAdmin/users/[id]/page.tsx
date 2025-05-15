"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Shield,
  Building,
  MapPin,
  CreditCard,
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

type UserDetail = {
  id: string;
  email: string;
  emailVerified: string | null;
  phone: string | null;
  role: string;
  companyName: string | null;
  location: string | null;
  subscriptionType: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  createdAt: string;
  clients: { id: string; name: string }[];
  payments: { id: string; amount: number; paymentDate: string }[];
};

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClients, setShowClients] = useState(true);
  const [showPayments, setShowPayments] = useState(true);

  // Format dates for display
  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Fetch user details from the API
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized: Please log in.");
          } else if (response.status === 403) {
            throw new Error(
              "Forbidden: You don't have permission to view this user."
            );
          } else if (response.status === 404) {
            throw new Error("User not found.");
          } else {
            throw new Error("Failed to fetch user data.");
          }
        }

        const data = await response.json();
        setUser(data);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message, { duration: 4000 });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  // Handle delete user
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to delete user.");
        }

        toast.success("User deleted successfully");
        router.push("/admin/users");
      } catch (err: any) {
        toast.error(err.message, { duration: 4000 });
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading user data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 p-6 rounded-lg shadow-md max-w-md text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-medium text-red-800">Error</h3>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("dashbordAdmin/users")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  // No user found
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-yellow-50 p-6 rounded-lg shadow-md max-w-md text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-medium text-yellow-800">
              No User Found
            </h3>
          </div>
          <p className="text-yellow-600 mb-4">
            The requested user could not be found.
          </p>
          <button
            onClick={() => router.push("dashboardAdmin/users")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* Back button and header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboardAdmin/users")}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Users
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">User Details</h1>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/dashboardAdmin/users/${userId}/edit`}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* User details card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {user.email}
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === "superadmin"
                      ? "bg-purple-100 text-purple-800"
                      : user.role === "manager"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {user.role}
                </span>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    user.subscriptionType === "free"
                      ? "bg-gray-100 text-gray-800"
                      : user.subscriptionType === "premium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-indigo-100 text-indigo-800"
                  }`}
                >
                  {user.subscriptionType || "No subscription"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">
                Basic Information
              </h3>
              <div className="space-y-1">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">{user.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">{user.phone || "N/A"}</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">Role: {user.role}</span>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">
                Company Information
              </h3>
              <div className="space-y-1">
                <div className="flex items-center">
                  <Building className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    {user.companyName || "N/A"}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    {user.location || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">
                Subscription
              </h3>
              <div className="space-y-1">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    {user.subscriptionType || "No subscription"}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    {formatDate(user.subscriptionStartDate)} -{" "}
                    {formatDate(user.subscriptionEndDate)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    Member since: {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clients section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowClients(!showClients)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">
                Clients ({user.clients.length})
              </h2>
            </div>
            {showClients ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
        {showClients && (
          <div className="p-4">
            {user.clients.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No clients found</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {user.clients.map((client) => (
                  <Link
                    key={client.id}
                    href={`/admin/clients/${client.id}`}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <h3 className="font-medium text-gray-800">
                        {client.name}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payments section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowPayments(!showPayments)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">
                Payments ({user.payments.length})
              </h2>
            </div>
            {showPayments ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
        {showPayments && (
          <div className="p-4">
            {user.payments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No payments found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Paid
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/payments/${payment.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
