"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  User,
  CreditCard,
  Calendar,
  DollarSign,
  Filter,
  RefreshCw,
  Search,
  Clock,
  Check,
  X,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

export default function HistoricPage() {
  const [historyEntries, setHistoryEntries] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch("/api/historic");
        if (!response.ok) {
          throw new Error("Failed to fetch history entries");
        }
        const data = await response.json();
        setHistoryEntries(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/historic");
      if (!response.ok) {
        throw new Error("Failed to fetch history entries");
      }
      const data = await response.json();
      setHistoryEntries(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getIconForField = (key) => {
    const iconMap = {
      name: <User className="h-4 w-4 text-blue-500" />,
      email: <User className="h-4 w-4 text-blue-500" />,
      phone: <User className="h-4 w-4 text-blue-500" />,
      amount: <DollarSign className="h-4 w-4 text-green-500" />,
      subscription: <CreditCard className="h-4 w-4 text-green-500" />,
      method: <CreditCard className="h-4 w-4 text-green-500" />,
      status: <CreditCard className="h-4 w-4 text-green-500" />,
      startDate: <Calendar className="h-4 w-4 text-purple-500" />,
      endDate: <Calendar className="h-4 w-4 text-purple-500" />,
      nextPaymentDate: <Calendar className="h-4 w-4 text-purple-500" />,
      paymentDate: <Calendar className="h-4 w-4 text-purple-500" />,
      paymentStatus: <CreditCard className="h-4 w-4 text-green-500" />,
      registrationDate: <Calendar className="h-4 w-4 text-purple-500" />,
      clientId: <User className="h-4 w-4 text-blue-500" />,
    };
    return iconMap[key] || null;
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "string" && !isNaN(Date.parse(value))) {
      const date = new Date(value);
      return date.toLocaleString() || value;
    }
    if (value instanceof Date && !isNaN(value)) {
      return value.toLocaleString();
    }
    return value;
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "CREATE":
        return <Plus className="h-4 w-4" />;
      case "UPDATE":
        return <Pencil className="h-4 w-4" />;
      case "DELETE":
        return <Trash2 className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800 border-green-200";
      case "UPDATE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "DELETE":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredEntries = historyEntries.filter((entry) => {
    // Filter by type
    if (filterType !== "all" && entry.action !== filterType) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        entry.description?.toLowerCase().includes(searchLower) ||
        entry.entityType?.toLowerCase().includes(searchLower) ||
        entry.client?.name?.toLowerCase().includes(searchLower) ||
        entry.client?.email?.toLowerCase().includes(searchLower) ||
        entry.payment?.subscription?.toLowerCase().includes(searchLower) ||
        entry.changedBy?.username?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            Loading activity history...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Something went wrong
          </h3>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-600 to-blue-600 p-8 rounded-2xl text-white shadow-xl">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-8 w-8" />
              Activity History
            </h1>
            <p className="text-indigo-100 mt-2 text-lg">
              Track all actions and changes in your system
            </p>
          </div>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search activities..."
                className="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 self-start md:self-auto">
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    filterType === "all"
                      ? "bg-white shadow text-blue-600"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setFilterType("all")}
                >
                  All
                </button>
                <button
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1 ${
                    filterType === "CREATE"
                      ? "bg-white shadow text-green-600"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setFilterType("CREATE")}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create
                </button>
                <button
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1 ${
                    filterType === "UPDATE"
                      ? "bg-white shadow text-blue-600"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setFilterType("UPDATE")}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Update
                </button>
                <button
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1 ${
                    filterType === "DELETE"
                      ? "bg-white shadow text-red-600"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setFilterType("DELETE")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* History Entries */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-500" />
                Recent Activity
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredEntries.length}{" "}
                {filteredEntries.length === 1 ? "entry" : "entries"} found
              </p>
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="text-gray-500 text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Activity className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium">No matching activity found</p>
              <p className="text-sm mt-1">
                {searchTerm || filterType !== "all"
                  ? "Try changing your search or filters"
                  : "Actions will appear here once you make changes"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-5 bg-white rounded-xl transition border border-gray-100 hover:border-blue-200 hover:shadow-md group relative overflow-hidden"
                >
                  {/* Color indicator strip */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      entry.action === "CREATE"
                        ? "bg-green-500"
                        : entry.action === "UPDATE"
                        ? "bg-blue-500"
                        : "bg-red-500"
                    }`}
                  ></div>

                  <div className="pl-3 flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(
                            entry.action
                          )}`}
                        >
                          <span className="mr-1">
                            {getActionIcon(entry.action)}
                          </span>
                          {entry.action}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-full">
                          {entry.entityType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">
                        {entry.description}
                      </p>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                        {entry.client && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                            <User className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                            <div className="truncate">
                              <span className="font-medium">Client:</span>{" "}
                              {entry.client.name} ({entry.client.email})
                            </div>
                          </div>
                        )}

                        {entry.payment && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                            <DollarSign className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            <div className="truncate">
                              <span className="font-medium">Payment:</span>{" "}
                              {entry.payment.amount} FCFA -{" "}
                              {entry.payment.subscription} (
                              {entry.payment.status})
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 mt-3 text-xs">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {new Date(entry.createdAt).toLocaleString()}
                        </div>

                        <div className="flex items-center gap-1 text-gray-500">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          {entry.changedBy.username}
                        </div>
                      </div>
                    </div>

                    {(entry.oldData || entry.newData) && (
                      <button
                        onClick={() => toggleRow(entry.id)}
                        className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium bg-blue-50 hover:bg-blue-100 transition px-3 py-1.5 rounded-lg"
                      >
                        {expandedRows[entry.id] ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Details
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {expandedRows[entry.id] && (
                    <div className="mt-5 border-t border-gray-100 pt-5 pl-3">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {entry.oldData && (
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                <X className="h-3.5 w-3.5" /> Previous Data
                              </span>
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(entry.oldData).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-100 group-hover:border-gray-200 transition"
                                  >
                                    {getIconForField(key)}
                                    <span className="text-xs font-medium text-gray-700 min-w-24">
                                      {key
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, (str) =>
                                          str.toUpperCase()
                                        )}
                                      :
                                    </span>
                                    <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded flex-grow break-all">
                                      {formatValue(value)}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {entry.newData && (
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                <Check className="h-3.5 w-3.5" /> Current Data
                              </span>
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(entry.newData).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-blue-100 group-hover:border-blue-200 transition"
                                  >
                                    {getIconForField(key)}
                                    <span className="text-xs font-medium text-gray-700 min-w-24">
                                      {key
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, (str) =>
                                          str.toUpperCase()
                                        )}
                                      :
                                    </span>
                                    <span className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded flex-grow break-all">
                                      {formatValue(value)}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination placeholder - could be implemented if needed */}
          {filteredEntries.length > 0 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center gap-1">
                <button className="p-2 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed">
                  <ChevronUp className="h-4 w-4 rotate-90" />
                </button>
                <button className="px-3 py-1 rounded-lg bg-blue-500 text-white font-medium">
                  1
                </button>
                <button className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                  2
                </button>
                <button className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                  3
                </button>
                <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
