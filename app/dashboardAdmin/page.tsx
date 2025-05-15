"use client";

import { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  Users,
  CreditCard,
  TrendingUp,
  Calendar,
  Search,
  Bell,
  Filter,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("month");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    revenue: 0,
    userGrowth: 0,
    subscriptionGrowth: 0,
    revenueGrowth: 0,
  });

  const [userChartData, setUserChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "New Users",
        data: [],
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
      },
    ],
  });

  const [revenueChartData, setRevenueChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Revenue",
        data: [],
        borderColor: "rgb(139, 92, 246)",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  });

  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Simulate data loading
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mock data based on date range
        const months =
          dateRange === "year"
            ? [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ]
            : dateRange === "month"
            ? ["Week 1", "Week 2", "Week 3", "Week 4"]
            : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        // Generate random data based on date range
        const generateRandomData = (min, max, length) => {
          return Array.from(
            { length },
            () => Math.floor(Math.random() * (max - min + 1)) + min
          );
        };

        const userData = generateRandomData(10, 40, months.length);
        const revenueData = generateRandomData(1000, 3000, months.length);

        // Update chart data
        setUserChartData({
          labels: months,
          datasets: [
            {
              label: "New Users",
              data: userData,
              backgroundColor: "rgba(59, 130, 246, 0.6)",
              borderColor: "rgb(59, 130, 246)",
              borderWidth: 2,
            },
          ],
        });

        setRevenueChartData({
          labels: months,
          datasets: [
            {
              label: "Revenue (USD)",
              data: revenueData,
              borderColor: "rgb(139, 92, 246)",
              backgroundColor: "rgba(139, 92, 246, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ],
        });

        // Stats data
        setStats({
          totalUsers: 2450,
          activeSubscriptions: 1870,
          revenue: 28750,
          userGrowth: 12.3,
          subscriptionGrowth: 8.7,
          revenueGrowth: 15.2,
        });

        // Mock user data
        setUsers([
          {
            id: 1,
            email: "jason.miller@example.com",
            name: "Jason Miller",
            role: "User",
            subscription: "Premium",
            lastActive: "2 hours ago",
            status: "active",
          },
          {
            id: 2,
            email: "sarah.wilson@example.com",
            name: "Sarah Wilson",
            role: "Admin",
            subscription: "Enterprise",
            lastActive: "5 mins ago",
            status: "active",
          },
          {
            id: 3,
            email: "michael.brown@example.com",
            name: "Michael Brown",
            role: "User",
            subscription: "Basic",
            lastActive: "1 day ago",
            status: "inactive",
          },
          {
            id: 4,
            email: "emma.davis@example.com",
            name: "Emma Davis",
            role: "User",
            subscription: "Premium",
            lastActive: "3 hours ago",
            status: "active",
          },
          {
            id: 5,
            email: "robert.jones@example.com",
            name: "Robert Jones",
            role: "Trainer",
            subscription: "Premium",
            lastActive: "4 days ago",
            status: "active",
          },
        ]);
      } catch (error) {
        toast.error("Failed to load admin data", { duration: 4000 });
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.email.toLowerCase().includes(lowercaseQuery) ||
            user.name.toLowerCase().includes(lowercaseQuery) ||
            user.role.toLowerCase().includes(lowercaseQuery) ||
            user.subscription.toLowerCase().includes(lowercaseQuery)
        )
      );
    }
  }, [searchQuery, users]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-800">
              E<span className="text-blue-600">Gym</span> Admin
            </h1>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-2 rounded-full hover:bg-gray-100 relative"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border border-gray-200 z-10">
                    <div className="p-3 border-b border-gray-200">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="p-3 border-b border-gray-100 hover:bg-gray-50">
                        <p className="text-sm">New premium user registration</p>
                        <p className="text-xs text-gray-500">10 minutes ago</p>
                      </div>
                      <div className="p-3 border-b border-gray-100 hover:bg-gray-50">
                        <p className="text-sm">Subscription payment failed</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                      <div className="p-3 hover:bg-gray-50">
                        <p className="text-sm">System maintenance complete</p>
                        <p className="text-xs text-gray-500">Yesterday</p>
                      </div>
                    </div>
                    <div className="p-2 border-t border-gray-200 text-center">
                      <button className="text-blue-600 text-sm hover:text-blue-800">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  A
                </div>
                <span className="text-sm font-medium">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            <p className="text-gray-600">
              Monitor and manage your gym's performance
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-col md:flex-row gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center">
              Export Report
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-6 overflow-x-auto">
            <button
              className={`pb-3 px-1 ${
                activeTab === "overview"
                  ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`pb-3 px-1 ${
                activeTab === "users"
                  ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("users")}
            >
              Users
            </button>
            <button
              className={`pb-3 px-1 ${
                activeTab === "subscriptions"
                  ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("subscriptions")}
            >
              Subscriptions
            </button>
            <button
              className={`pb-3 px-1 ${
                activeTab === "payments"
                  ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("payments")}
            >
              Payments
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === "overview" && (
              <>
                {/* Stats Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-lg mr-4">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Users</p>
                          <p className="text-2xl font-bold">
                            {stats.totalUsers.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`flex items-center ${
                          stats.userGrowth >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stats.userGrowth >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(stats.userGrowth)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-3 rounded-lg mr-4">
                          <CreditCard className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Active Subscriptions
                          </p>
                          <p className="text-2xl font-bold">
                            {stats.activeSubscriptions.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`flex items-center ${
                          stats.subscriptionGrowth >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stats.subscriptionGrowth >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(stats.subscriptionGrowth)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-purple-100 p-3 rounded-lg mr-4">
                          <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Revenue (USD)</p>
                          <p className="text-2xl font-bold">
                            ${stats.revenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`flex items-center ${
                          stats.revenueGrowth >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stats.revenueGrowth >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(stats.revenueGrowth)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      User Growth
                    </h3>
                    <div className="h-64">
                      <Bar
                        data={userChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: { mode: "index", intersect: false },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              grid: { drawBorder: false },
                            },
                            x: {
                              grid: { display: false },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Revenue Trend
                    </h3>
                    <div className="h-64">
                      <Line
                        data={revenueChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: { mode: "index", intersect: false },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              grid: { drawBorder: false },
                              ticks: {
                                callback: function (value) {
                                  return "$" + value;
                                },
                              },
                            },
                            x: {
                              grid: { display: false },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Recent Users
                    </h3>
                    <Link
                      href="/dashboardAdmin/users"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View All
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-gray-500 bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">Role</th>
                          <th className="px-4 py-3 font-medium">
                            Subscription
                          </th>
                          <th className="px-4 py-3 font-medium">Last Active</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.slice(0, 5).map((user) => (
                          <tr
                            key={user.id}
                            className="border-t hover:bg-gray-50"
                          >
                            <td className="px-4 py-3">{user.name}</td>
                            <td className="px-4 py-3">{user.email}</td>
                            <td className="px-4 py-3">{user.role}</td>
                            <td className="px-4 py-3">{user.subscription}</td>
                            <td className="px-4 py-3">{user.lastActive}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  user.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {user.status.charAt(0).toUpperCase() +
                                  user.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button className="text-blue-600 hover:text-blue-800">
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === "users" && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    User Management
                  </h3>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="relative">
                      <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </button>
                    </div>

                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      Add New User
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-gray-500 bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Email</th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Subscription</th>
                        <th className="px-4 py-3 font-medium">Last Active</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3">{user.name}</td>
                          <td className="px-4 py-3">{user.email}</td>
                          <td className="px-4 py-3">{user.role}</td>
                          <td className="px-4 py-3">{user.subscription}</td>
                          <td className="px-4 py-3">{user.lastActive}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {user.status.charAt(0).toUpperCase() +
                                user.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-800">
                                Edit
                              </button>
                              <button className="text-red-600 hover:text-red-800">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No users found matching your search criteria.
                    </p>
                  </div>
                )}

                {filteredUsers.length > 0 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing 1-{filteredUsers.length} of {users.length} users
                    </p>
                    <div className="flex space-x-1">
                      <button className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50">
                        Previous
                      </button>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                        1
                      </button>
                      <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
