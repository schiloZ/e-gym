"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
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

type CompanyDetail = {
  id: string;
  name: string;
  location: string | null;
  subscriptionType: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  clientRegistrationCount: number;
  maxClientRegistrations: number;
  paymentCount: number;
  maxPayments: number;
  createdAt: string;
  updatedAt: string;
  users: {
    id: string;
    email: string;
    phone: string | null;
    role: string;
    createdAt: string;
  }[];
  clients: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
  }[];
};

export default function CompanyEditPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    subscriptionType: "",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    clientRegistrationCount: 0,
    maxClientRegistrations: 0,
    paymentCount: 0,
    maxPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Format dates for display
  const formatDate = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0]; // Format as YYYY-MM-DD for input
  };

  // Fetch company details from the API
  useEffect(() => {
    const fetchCompany = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/company/${companyId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized: Please log in.");
          } else if (response.status === 403) {
            throw new Error(
              "Forbidden: You don't have permission to edit this company."
            );
          } else if (response.status === 404) {
            throw new Error("Company not found.");
          } else {
            throw new Error("Failed to fetch company data.");
          }
        }
        console.log("Response from API:", response);
        const data = await response.json();
        setCompany(data);
        setFormData({
          name: data.name,
          location: data.location || "",
          subscriptionType: data.subscriptionType || "",
          subscriptionStartDate: formatDate(data.subscriptionStartDate),
          subscriptionEndDate: formatDate(data.subscriptionEndDate),
          clientRegistrationCount: data.clientRegistrationCount || 0,
          maxClientRegistrations: data.maxClientRegistrations || 0,
          paymentCount: data.paymentCount || 0,
          maxPayments: data.maxPayments || 0,
        });
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message, { duration: 4000 });
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [companyId]);

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
      const response = await fetch(`/api/company/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          subscriptionType: formData.subscriptionType,
          subscriptionStartDate: formData.subscriptionStartDate,
          subscriptionEndDate: formData.subscriptionEndDate,
          clientRegistrationCount: formData.clientRegistrationCount,
          paymentCount: formData.paymentCount,
          maxClientRegistrations: formData.maxClientRegistrations,
          maxPayments: formData.maxPayments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update company.");
      }

      const updatedCompany = await response.json();
      setCompany(updatedCompany); // Update local state with new data
      toast.success("Company updated successfully", { duration: 4000 });
      router.push(`/dashboardAdmin/users/${companyId}`);
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
          <span className="text-lg text-gray-600">Loading company data...</span>
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
            Back to Companies
          </button>
        </div>
      </div>
    );
  }

  // No company found
  if (!company) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-yellow-50 p-6 rounded-lg shadow-md max-w-md text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-medium text-yellow-800">
              No Company Found
            </h3>
          </div>
          <p className="text-yellow-600 mb-4">
            The requested company could not be found.
          </p>
          <button
            onClick={() => router.push("/dashboardAdmin/users")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Companies
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
          Back to Companies
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Edit Company</h1>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
              <div className="flex items-center">
                <Building className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  required
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
              onClick={() => router.push(`/dashboardAdmin/users/${companyId}`)}
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
