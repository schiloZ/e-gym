"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Building,
  Mail,
  Phone,
  Shield,
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
  User,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

type Payment = {
  id: string;
  amount: number;
  paymentDate: string;
  status: string;
  createdAt: string;
};

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
    registrationDate: string;
  }[];
  payments: Payment[];
};

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUsers, setShowUsers] = useState(true);
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

  // Format currency for payment amounts
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Fetch company details from the API
  useEffect(() => {
    const fetchCompany = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/company/${companyId}`, {
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
              "Forbidden: You don't have permission to view this company."
            );
          } else if (response.status === 404) {
            throw new Error("Company not found.");
          } else {
            throw new Error("Failed to fetch company data.");
          }
        }

        const data = await response.json();
        console.log(data);
        setCompany(data);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message, { duration: 4000 });
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [companyId]);

  // Handle delete company
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      try {
        const response = await fetch(`/api/company/${companyId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to delete company.");
        }

        toast.success("Company deleted successfully");
        router.push("/dashboardAdmin/users");
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
            <h1 className="text-2xl font-bold text-gray-800">
              Company Details
            </h1>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/dashboardAdmin/users/${companyId}/edit`}
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

      {/* Company details card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {company.name}
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    company.subscriptionType === "free"
                      ? "bg-gray-100 text-gray-800"
                      : company.subscriptionType === "premium"
                      ? "bg-yellow-100 text-yellow-800"
                      : company.subscriptionType === "enterprise"
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {company.subscriptionType || "No subscription"}
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
                  <Building className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">{company.name}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    {company.location || "N/A"}
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
                    {company.subscriptionType || "No subscription"}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    {formatDate(company.subscriptionStartDate)} -{" "}
                    {formatDate(company.subscriptionEndDate)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    Created: {formatDate(company.createdAt)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    Updated: {formatDate(company.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Limits Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Limits</h3>
              <div className="space-y-1">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    Clients: {company.clientRegistrationCount}/
                    {company.maxClientRegistrations}
                  </span>
                </div>
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    Payments: {company.paymentCount}/{company.maxPayments}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowUsers(!showUsers)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">
                Users ({company.users.length})
              </h2>
            </div>
            {showUsers ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
        {showUsers && (
          <div className="p-4">
            {company.users.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No users found</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {company.users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/dashboardAdmin/users/${user.id}`}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <h3 className="font-medium text-gray-800">
                        {user.email}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
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
                Clients ({company.clients.length})
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
            {company.clients.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No clients found</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {company.clients.map((client) => (
                  <Link
                    key={client.id}
                    href={`/dashboardAdmin/clients/${client.id}`}
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
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowPayments(!showPayments)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">
                Payments ({company.payments.length})
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
            {company.payments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No payments found
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {company.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-medium text-gray-800">
                          {formatCurrency(payment.amount)}
                        </h3>
                        <div className="text-sm text-gray-600">
                          Date: {formatDate(payment.paymentDate)}
                        </div>
                        <div className="text-sm">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              payment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : payment.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
