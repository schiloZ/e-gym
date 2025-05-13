"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  Calendar,
  DollarSign,
  Search,
  ArrowRight,
  TrendingUp,
  Activity,
  BarChart,
} from "lucide-react";
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

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averagePayment: 0,
  });
  const [recentClients, setRecentClients] = useState([]);
  const [chartData, setChartData] = useState({
    registrationsPerDay: [],
    activeSubscriptionsPerDay: [],
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch stats, recent clients, and chart data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch total clients
        const clientsRes = await fetch("/api/clients");
        const clientsData = await clientsRes.json();
        const totalClients = clientsData.length || 0;

        // Fetch payments for revenue calculations
        const paymentsRes = await fetch("/api/payments");
        const paymentsData = await paymentsRes.json();
        const totalRevenue = paymentsData.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );

        // Calculate monthly revenue (for May 2025)
        const currentMonth = new Date("2025-05-01");
        const monthlyPayments = paymentsData.filter((payment) => {
          const paymentDate = new Date(payment.date);
          return (
            paymentDate.getMonth() === currentMonth.getMonth() &&
            paymentDate.getFullYear() === currentMonth.getFullYear()
          );
        });
        const monthlyRevenue = monthlyPayments.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );

        // Calculate average payment
        const averagePayment =
          paymentsData.length > 0 ? totalRevenue / paymentsData.length : 0;

        setStats({
          totalClients,
          totalRevenue,
          monthlyRevenue,
          averagePayment: Math.round(averagePayment),
        });

        // Fetch recent clients (sorted by registration date, limit 5)
        const recentClients = clientsData
          .sort(
            (a, b) =>
              new Date(b.registrationDate).getTime() -
              new Date(a.registrationDate).getTime()
          )
          .slice(0, 5);
        setRecentClients(recentClients);

        // Fetch chart data
        const [registrations, subscriptions] = await Promise.all([
          fetch("/api/stats/registrations-per-day").then((res) => res.json()),
          fetch("/api/stats/active-subscriptions-per-day").then((res) =>
            res.json()
          ),
        ]);
        setChartData({
          registrationsPerDay: registrations,
          activeSubscriptionsPerDay: subscriptions,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  // Chart configurations (reused from StatsPage)
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#1e293b",
        bodyColor: "#334155",
        titleFont: { weight: "bold" },
        bodyFont: { size: 13 },
        padding: 12,
        borderColor: "rgba(203, 213, 225, 0.5)",
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US").format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    elements: {
      line: { tension: 0.3 },
      point: { radius: 3, hoverRadius: 5 },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { font: { size: 10 }, color: "#94a3b8" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(203, 213, 225, 0.2)", drawBorder: false },
        ticks: { font: { size: 11 }, color: "#94a3b8", padding: 8 },
      },
    },
  };

  // Registrations chart data
  const registrationsData = {
    labels: chartData.registrationsPerDay.map((d) =>
      new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Registrations",
        data: chartData.registrationsPerDay.map((d) => d.count),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgba(37, 99, 235, 1)",
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 12,
      },
    ],
  };

  // Subscriptions chart data
  const subscriptionsData = {
    labels: chartData.activeSubscriptionsPerDay.map((d) =>
      new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Active Subscriptions",
        data: chartData.activeSubscriptionsPerDay.map((d) => d.count),
        backgroundColor: "rgba(168, 85, 247, 0.15)",
        borderColor: "rgba(126, 34, 206, 1)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgba(126, 34, 206, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 1,
        pointRadius: 4,
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-xl text-white shadow-lg">
        <div>
          <h1 className="text-3xl font-bold">E-Gym Dashboard</h1>
          <p className="text-blue-100">
            Manage your fitness business with ease
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/clients/new"
            className="bg-white text-blue-600 hover:bg-blue-50 py-2 px-4 rounded-lg font-medium flex items-center gap-2 transition shadow-md"
          >
            <Users className="h-5 w-5" />
            New Client
          </Link>
          <Link
            href="/dashboard/payments/new"
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium flex items-center gap-2 transition shadow-md"
          >
            <CreditCard className="h-5 w-5" />
            New Payment
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition group">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Clients</p>
              <p className="text-3xl font-bold text-gray-800 mt-2 mb-1 group-hover:text-blue-600 transition">
                {stats.totalClients}
              </p>
              <p className="text-xs font-medium text-gray-400 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                <span className="text-green-500">+0</span> this month
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition group">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-800 mt-2 mb-1 group-hover:text-green-600 transition">
                {stats.totalRevenue.toLocaleString()} FCFA
              </p>
              <p className="text-xs font-medium text-gray-400">
                Lifetime earnings
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full text-green-500 group-hover:bg-green-500 group-hover:text-white transition">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500 hover:shadow-lg transition group">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Monthly Revenue
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2 mb-1 group-hover:text-purple-600 transition">
                {stats.monthlyRevenue.toLocaleString()} FCFA
              </p>
              <p className="text-xs font-medium text-gray-400 flex items-center">
                <Activity className="h-3 w-3 mr-1 text-purple-500" />
                <span>0 payments</span> this month
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500 hover:shadow-lg transition group">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Average Payment
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2 mb-1 group-hover:text-orange-600 transition">
                {stats.averagePayment.toLocaleString()} FCFA
              </p>
              <p className="text-xs font-medium text-gray-400">
                Per transaction
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Clients */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-500" />
                Recent Clients
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Your most recently registered clients
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50"
                placeholder="Search clients..."
              />
            </div>
          </div>
          <div className="space-y-4">
            {recentClients.map((client) => (
              <div
                key={client.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition border border-gray-100 hover:border-blue-200"
              >
                <div>
                  <p className="font-semibold text-gray-800">{client.name}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-1">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <span className="text-blue-500">✉️</span>{" "}
                      {client.email || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <span className="text-blue-500">📞</span>{" "}
                      {client.phone || "N/A"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <span className="text-blue-500">📅</span> Registered:{" "}
                    {new Date(client.registrationDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg text-sm font-medium transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
            {recentClients.length === 0 && (
              <div className="text-gray-500 text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="font-medium">No clients found</p>
                <p className="text-sm mt-1">
                  Add your first client to get started
                </p>
              </div>
            )}
          </div>
          {recentClients.length > 0 && (
            <div className="mt-4 text-center">
              <Link
                href="/dashboard/clients"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
              >
                View all clients
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Registrations Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-500">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-500" />
                  User Registrations
                </h2>
                <p className="text-sm text-gray-600">New users over time</p>
              </div>
            </div>
            <div className="h-64">
              <Bar data={registrationsData} options={commonOptions} />
            </div>
          </div>

          {/* Subscriptions Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-purple-500">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                  Active Subscriptions
                </h2>
                <p className="text-sm text-gray-600">
                  Subscription growth over time
                </p>
              </div>
            </div>
            <div className="h-64">
              <Line data={subscriptionsData} options={commonOptions} />
            </div>
          </div>

          {/* Business Analytics */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-purple-500" />
              Business Analytics
            </h2>
            <div className="space-y-3">
              <Link
                href="/dashboard/payments"
                className="text-gray-700 hover:text-blue-600 flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition"
              >
                <span className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                  Payment History
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/reports"
                className="text-gray-700 hover:text-blue-600 flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition"
              >
                <span className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                  Financial Reports
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/clients"
                className="text-gray-700 hover:text-blue-600 flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition"
              >
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-purple-500" />
                  Client Management
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/reports"
                className="text-gray-700 hover:text-blue-600 flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition"
              >
                <span className="flex items-center">
                  <BarChart className="h-4 w-4 mr-2 text-purple-500" />
                  View More Analytics
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
