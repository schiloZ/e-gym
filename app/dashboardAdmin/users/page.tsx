"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Loader2,
  AlertCircle,
  Calendar,
  Building,
  MapPin,
  CreditCard,
  Mail,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Download,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

type User = {
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

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  // Fetch users from the API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Please log in as a superadmin.");
        } else if (response.status === 403) {
          throw new Error("Forbidden: Only superadmins can access this page.");
        } else {
          throw new Error("Failed to fetch users.");
        }
      }

      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message, { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and search
  useEffect(() => {
    let result = [...users];

    // Apply search
    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.companyName &&
            user.companyName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (user.location &&
            user.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply role filter
    if (activeFilter) {
      if (activeFilter !== "all") {
        result = result.filter(
          (user) =>
            user.role === activeFilter || user.subscriptionType === activeFilter
        );
      }
    }

    setFilteredUsers(result);
  }, [searchTerm, activeFilter, users]);

  // Format dates for display
  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle row click to navigate to user detail page
  const handleRowClick = (userId: string) => {
    router.push(`/dashboardAdmin/users/${userId}`);
  };

  const handleAddNewUser = () => {
    router.push("/dashboardAdmin/users/new");
  };

  const toggleDropdown = (userId: string) => {
    if (showDropdown === userId) {
      setShowDropdown(null);
    } else {
      setShowDropdown(userId);
    }
  };

  const handleExportData = () => {
    toast.success("Exporting user data...");
    // Implementation for exporting data would go here
  };

  const handleRefresh = () => {
    fetchUsers();
    toast.success("User data refreshed");
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <span className="text-xl text-gray-700">Loading users...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-red-50 p-8 rounded-xl shadow-lg flex items-center space-x-4 max-w-lg">
          <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 mb-1">Error</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Manage Users
              </h1>
            </div>

            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
              <button
                onClick={handleAddNewUser}
                className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Add New User
              </button>
              <button
                onClick={handleExportData}
                className="flex items-center justify-center bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="h-5 w-5 mr-2" />
                Export Data
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center md:space-x-4">
            <div className="relative flex-grow mb-4 md:mb-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users by email, company or location..."
                className="bg-white border border-gray-200 rounded-lg py-2 pl-10 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  activeFilter === "all" || !activeFilter
                    ? "bg-blue-100 text-blue-800"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setActiveFilter("superadmin")}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  activeFilter === "superadmin"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                Superadmins
              </button>
              <button
                onClick={() => setActiveFilter("manager")}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  activeFilter === "manager"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                Managers
              </button>
              <button
                onClick={() => setActiveFilter("user")}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  activeFilter === "user"
                    ? "bg-green-100 text-green-800"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveFilter("premium")}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  activeFilter === "premium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                Premium
              </button>
              <button
                onClick={() => setActiveFilter("free")}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  activeFilter === "free"
                    ? "bg-gray-200 text-gray-800"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                Free Users
              </button>
            </div>
          </div>
        </div>

        {/* Users Count & Results */}
        <div className="mb-4 text-gray-600">
          Showing <span className="font-medium">{filteredUsers.length}</span> of{" "}
          <span className="font-medium">{users.length}</span> total users
        </div>

        {/* Users Cards (Mobile View) */}
        <div className="lg:hidden grid grid-cols-1 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
              No users found matching your search criteria.
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
                onClick={() => handleRowClick(user.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="mb-3">
                    <div className="text-lg font-medium text-gray-900">
                      {user.email}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Created {formatDate(user.createdAt)}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(user.id);
                      }}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <MoreHorizontal className="h-5 w-5 text-gray-500" />
                    </button>

                    {showDropdown === user.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-100">
                        <div
                          className="py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle edit action
                            router.push(
                              `/dashboardAdmin/users/${user.id}/edit`
                            );
                          }}
                        >
                          Edit User
                        </div>
                        <div
                          className="py-2 px-4 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle delete action
                            toast.success("Delete functionality would go here");
                          }}
                        >
                          Delete User
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600 truncate">
                      {user.companyName || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600 truncate">
                      {user.location || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between mt-4">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
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
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
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
            ))
          )}
        </div>

        {/* Users Table (Desktop View) */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 font-medium text-gray-700">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      Email
                    </div>
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-700">Role</th>
                  <th className="px-6 py-4 font-medium text-gray-700">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-gray-500" />
                      Company
                    </div>
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-700">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      Location
                    </div>
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-700">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                      Subscription
                    </div>
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-700">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      Created At
                    </div>
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-700 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No users found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(user.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.role === "superadmin"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "manager"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">{user.companyName || "N/A"}</td>
                      <td className="px-6 py-4">{user.location || "N/A"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.subscriptionType === "free"
                              ? "bg-gray-100 text-gray-800"
                              : user.subscriptionType === "premium"
                              ? "bg-yellow-100 text-yellow-800"
                              : user.subscriptionType === "enterprise"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {user.subscriptionType || "No subscription"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button
                          className="p-2 rounded-full hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(user.id);
                          }}
                        >
                          <MoreHorizontal className="h-5 w-5 text-gray-500" />
                        </button>

                        {showDropdown === user.id && (
                          <div className="absolute right-6 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-100">
                            <div
                              className="py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle edit action
                                router.push(
                                  `/dashboardAdmin/users/${user.id}/edit`
                                );
                              }}
                            >
                              Edit User
                            </div>
                            <div
                              className="py-2 px-4 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle delete action
                                toast.success(
                                  "Delete functionality would go here"
                                );
                              }}
                            >
                              Delete User
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
