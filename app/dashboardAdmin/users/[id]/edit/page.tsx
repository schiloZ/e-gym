"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Shield,
  Building,
  MapPin,
  CreditCard,
  Calendar,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

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
  clientRegistrationCount: number; // New field
  maxClientRegistrations: number; // New field
  paymentCount: number; // New field
  maxPayments: number; // New field
  clients: { id: string; name: string }[];
  payments: { id: string; amount: number; paymentDate: string }[];
};

export default function UserEditPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    emailVerified: "",
    phone: "",
    role: "",
    companyName: "",
    location: "",
    subscriptionType: "",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    clientRegistrationCount: 0, // New field
    maxClientRegistrations: 0, // New field
    paymentCount: 0, // New field
    maxPayments: 0, // New field
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Format dates for display
  const formatDate = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0]; // Format as YYYY-MM-DD for input
  };

  // Fetch user details from the API
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized: Please log in.");
          } else if (response.status === 403) {
            throw new Error(
              "Forbidden: You don't have permission to edit this user."
            );
          } else if (response.status === 404) {
            throw new Error("User not found.");
          } else {
            throw new Error("Failed to fetch user data.");
          }
        }

        const data = await response.json();
        setUser(data);
        setFormData({
          email: data.email,
          emailVerified: data.emailVerified || "",
          phone: data.phone || "",
          role: data.role,
          companyName: data.companyName || "",
          location: data.location || "",
          subscriptionType: data.subscriptionType || "",
          subscriptionStartDate: formatDate(data.subscriptionStartDate),
          subscriptionEndDate: formatDate(data.subscriptionEndDate),
          clientRegistrationCount: data.clientRegistrationCount || 0, // Sync new field
          maxClientRegistrations: data.maxClientRegistrations || 0, // Sync new field
          paymentCount: data.paymentCount || 0, // Sync new field
          maxPayments: data.maxPayments || 0, // Sync new field
        });
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message, { duration: 4000 });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let parsedValue = value;

    // Parse numeric fields to ensure they are integers
    if (
      [
        "clientRegistrationCount",
        "maxClientRegistrations",
        "paymentCount",
        "maxPayments",
      ].includes(name)
    ) {
      parsedValue = parseInt(value, 10) || 0; // Default to 0 if invalid
    }

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user.");
      }

      const updatedUser = await response.json();
      setUser(updatedUser); // Update local state with new data
      toast.success("User updated successfully", { duration: 4000 });
      router.push(`/dashboardAdmin/users/${userId}`);
    } catch (err: any) {
      toast.error(err.message, { duration: 4000 });
    } finally {
      setSubmitLoading(false);
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
            onClick={() => router.push("/dashboardAdmin/users")}
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
            onClick={() => router.push("/dashboardAdmin/users")}
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
            <h1 className="text-2xl font-bold text-gray-800">Edit User</h1>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  required
                />
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-gray-400 mr-2" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  required
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
              <div className="flex items-center">
                <Building className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subscription Type
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                <select
                  name="subscriptionType"
                  value={formData.subscriptionType}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                >
                  <option value="">Select Subscription</option>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subscription Start Date
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="date"
                  name="subscriptionStartDate"
                  value={formData.subscriptionStartDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subscription End Date
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="date"
                  name="subscriptionEndDate"
                  value={formData.subscriptionEndDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Registration Count
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="number"
                  name="clientRegistrationCount"
                  value={formData.clientRegistrationCount}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  min="0"
                />
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Client Registrations
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="number"
                  name="maxClientRegistrations"
                  value={formData.maxClientRegistrations}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  min="0"
                />
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Count
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="number"
                  name="paymentCount"
                  value={formData.paymentCount}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  min="0"
                />
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Payments
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="number"
                  name="maxPayments"
                  value={formData.maxPayments}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  min="0"
                />
              </div>
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push(`/dashboardAdmin/users/${userId}`)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
