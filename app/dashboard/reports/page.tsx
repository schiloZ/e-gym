"use client";

import { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  AlertCircle,
  Loader2,
  BarChart,
  DollarSign,
  User,
  Calendar,
  TrendingUp,
  Download,
  RefreshCw,
  ChevronDown,
  Filter,
} from "lucide-react";
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

export default function StatsPage() {
  const [stats, setStats] = useState({
    registrationsPerDay: [],
    paymentsPerDay: [],
    paymentAmountPerDay: [],
    activeSubscriptionsPerDay: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("week"); // week, month, year, all
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // In a real app, we would add timeRange as a query parameter
      const [registrations, payments, amounts, subscriptions] =
        await Promise.all([
          fetch("/api/stats/registrations-per-day").then((res) => res.json()),
          fetch("/api/stats/payments-per-day").then((res) => res.json()),
          fetch("/api/stats/payment-amount-per-day").then((res) => res.json()),
          fetch("/api/stats/active-subscriptions-per-day").then((res) =>
            res.json()
          ),
        ]);
      setStats({
        registrationsPerDay: registrations,
        paymentsPerDay: payments,
        paymentAmountPerDay: amounts,
        activeSubscriptionsPerDay: subscriptions,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics for the metric cards
  const getTotalRegistrations = () => {
    return stats.registrationsPerDay.reduce((sum, day) => sum + day.count, 0);
  };

  const getTotalPayments = () => {
    return stats.paymentsPerDay.reduce((sum, day) => sum + day.count, 0);
  };

  const getTotalAmount = () => {
    return stats.paymentAmountPerDay.reduce(
      (sum, day) => sum + day.totalAmount,
      0
    );
  };

  const getActiveSubscriptions = () => {
    const subscriptions = stats.activeSubscriptionsPerDay;
    return subscriptions.length > 0
      ? subscriptions[subscriptions.length - 1].count
      : 0;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  // Calculate trends (percentage change)
  const calculateTrend = (data) => {
    if (!data || data.length < 2) return 0;

    const current =
      data[data.length - 1].count || data[data.length - 1].totalAmount || 0;
    const previous =
      data[data.length - 2].count || data[data.length - 2].totalAmount || 0;

    if (previous === 0) return 100; // If previous was 0, show 100% increase
    return ((current - previous) / previous) * 100;
  };

  // Chart configurations
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
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
              if (context.dataset.yAxisID === "amount") {
                label += formatCurrency(context.parsed.y);
              } else {
                label += formatNumber(context.parsed.y);
              }
            }
            return label;
          },
        },
      },
    },
    elements: {
      line: {
        tension: 0.3, // Smoother curves for line charts
      },
      point: {
        radius: 3,
        hoverRadius: 5,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          color: "#94a3b8",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(203, 213, 225, 0.2)",
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: "#94a3b8",
          padding: 8,
        },
      },
    },
  };

  // Registration chart data
  const registrationsData = {
    labels: stats.registrationsPerDay.map((d) =>
      new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Registrations",
        data: stats.registrationsPerDay.map((d) => d.count),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgba(37, 99, 235, 1)",
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 12,
      },
    ],
  };

  // Payments chart data
  const paymentsData = {
    labels: stats.paymentsPerDay.map((d) =>
      new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Payments",
        data: stats.paymentsPerDay.map((d) => d.count),
        backgroundColor: "rgba(34, 197, 94, 0.7)",
        borderColor: "rgba(22, 163, 74, 1)",
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 12,
      },
    ],
  };

  // Amounts chart data
  const amountsData = {
    labels: stats.paymentAmountPerDay.map((d) =>
      new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Total Amount",
        data: stats.paymentAmountPerDay.map((d) => d.totalAmount),
        backgroundColor: "rgba(245, 158, 11, 0.7)",
        borderColor: "rgba(217, 119, 6, 1)",
        borderWidth: 2,
        yAxisID: "amount",
        borderRadius: 4,
        barThickness: 12,
      },
    ],
  };

  // Subscriptions chart data
  const subscriptionsData = {
    labels: stats.activeSubscriptionsPerDay.map((d) =>
      new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Active Subscriptions",
        data: stats.activeSubscriptionsPerDay.map((d) => d.count),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-lg">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-gray-800">
            Loading statistics
          </h3>
          <p className="text-gray-500 mt-2">
            Please wait while we fetch your data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="flex items-center gap-3 text-red-500 mb-4">
            <AlertCircle className="h-8 w-8" />
            <h2 className="text-xl font-bold">Failed to load statistics</h2>
          </div>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart className="h-6 w-6 text-blue-600" />
                Statistics Dashboard
              </h1>
              <p className="text-gray-500 mt-1">
                Insights into business performance and user engagement
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showFilters && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-100">
                    <button
                      onClick={() => {
                        setTimeRange("week");
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                        timeRange === "week"
                          ? "text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      Last 7 days
                    </button>
                    <button
                      onClick={() => {
                        setTimeRange("month");
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                        timeRange === "month"
                          ? "text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      Last 30 days
                    </button>
                    <button
                      onClick={() => {
                        setTimeRange("year");
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                        timeRange === "year"
                          ? "text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      Last 12 months
                    </button>
                    <button
                      onClick={() => {
                        setTimeRange("all");
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                        timeRange === "all"
                          ? "text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      All time
                    </button>
                  </div>
                )}
              </div>

              <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </button>

              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Registrations Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Total Registrations
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatNumber(getTotalRegistrations())}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {calculateTrend(stats.registrationsPerDay) > 0 ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />+
                  {calculateTrend(stats.registrationsPerDay).toFixed(1)}%
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
                  {calculateTrend(stats.registrationsPerDay).toFixed(1)}%
                </span>
              )}
              <span className="text-xs text-gray-500 ml-2">
                vs previous period
              </span>
            </div>
          </div>

          {/* Payments Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Total Payments
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatNumber(getTotalPayments())}
                </h3>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {calculateTrend(stats.paymentsPerDay) > 0 ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />+
                  {calculateTrend(stats.paymentsPerDay).toFixed(1)}%
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
                  {calculateTrend(stats.paymentsPerDay).toFixed(1)}%
                </span>
              )}
              <span className="text-xs text-gray-500 ml-2">
                vs previous period
              </span>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Total Revenue
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(getTotalAmount())}
                </h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {calculateTrend(stats.paymentAmountPerDay) > 0 ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />+
                  {calculateTrend(stats.paymentAmountPerDay).toFixed(1)}%
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
                  {calculateTrend(stats.paymentAmountPerDay).toFixed(1)}%
                </span>
              )}
              <span className="text-xs text-gray-500 ml-2">
                vs previous period
              </span>
            </div>
          </div>

          {/* Subscriptions Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Active Subscriptions
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatNumber(getActiveSubscriptions())}
                </h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {calculateTrend(stats.activeSubscriptionsPerDay) > 0 ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />+
                  {calculateTrend(stats.activeSubscriptionsPerDay).toFixed(1)}%
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
                  {calculateTrend(stats.activeSubscriptionsPerDay).toFixed(1)}%
                </span>
              )}
              <span className="text-xs text-gray-500 ml-2">
                vs previous period
              </span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registrations Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  User Registrations
                </h2>
                <p className="text-sm text-gray-500">New users over time</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="h-64">
              <Bar data={registrationsData} options={commonOptions} />
            </div>
          </div>

          {/* Payments Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Payment Transactions
                </h2>
                <p className="text-sm text-gray-500">
                  Number of payments processed
                </p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="h-64">
              <Bar data={paymentsData} options={commonOptions} />
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Revenue</h2>
                <p className="text-sm text-gray-500">
                  Total payment amount per day
                </p>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="h-64">
              <Bar
                data={amountsData}
                options={{
                  ...commonOptions,
                  plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                      ...commonOptions.plugins.tooltip,
                      callbacks: {
                        label: function (context) {
                          let label = context.dataset.label || "";
                          if (label) {
                            label += ": ";
                          }
                          if (context.parsed.y !== null) {
                            label += formatCurrency(context.parsed.y);
                          }
                          return label;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Subscriptions Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Active Subscriptions
                </h2>
                <p className="text-sm text-gray-500">
                  Subscription growth over time
                </p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="h-64">
              <Line data={subscriptionsData} options={commonOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
