"use client";

import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  AlertCircle,
  Loader2,
  User,
  DollarSign,
  Activity,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react";

export default function DatesPage() {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const response = await fetch("/api/schedule");
        if (!response.ok) {
          throw new Error("Failed to fetch dates");
        }
        const data = await response.json();
        setDates(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDates();
  }, []);

  const formatValue = (value) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "string" && !isNaN(Date.parse(value))) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date.toLocaleString();
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toLocaleString();
    }
    return value;
  };

  const formatDateHeader = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSidebarOpen(true);
  };

  const getEventsForDate = (date) => {
    if (!date) return [];

    let filtered = dates.filter(
      (d) =>
        d.date &&
        new Date(d.date).toDateString() === new Date(date).toDateString()
    );

    // Apply filters
    if (filter !== "all") {
      filtered = filtered.filter((d) => d.source === filter);
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          (d.entityName && d.entityName.toLowerCase().includes(term)) ||
          (d.type && d.type.toLowerCase().includes(term))
      );
    }

    return filtered;
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];

    // Add empty cells for days before the start of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="h-24 border border-gray-100 bg-gray-50 opacity-50"
        ></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const events = getEventsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected =
        selectedDate && selectedDate.toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(date)}
          className={`h-24 border border-gray-100 p-1 transition-all cursor-pointer relative
                    hover:bg-blue-50 hover:border-blue-200
                    ${isToday ? "bg-blue-50 border-blue-300" : "bg-white"}
                    ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
        >
          <div className="flex justify-between">
            <span
              className={`font-medium text-sm p-1 rounded-full w-6 h-6 flex items-center justify-center
                          ${isToday ? "bg-blue-500 text-white" : ""}`}
            >
              {day}
            </span>
            {events.length > 0 && (
              <span className="text-xs bg-blue-100 rounded-full w-5 h-5 flex items-center justify-center text-blue-800 font-bold">
                {events.length}
              </span>
            )}
          </div>

          {/* Show up to 3 event indicators */}
          <div className="mt-1 space-y-1">
            {events.slice(0, 2).map((event, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full text-xs truncate
                          ${
                            event.source === "Client"
                              ? "bg-blue-400"
                              : event.source === "Payment"
                              ? "bg-green-400"
                              : "bg-purple-400"
                          }`}
              ></div>
            ))}
            {events.length > 2 && (
              <div className="text-xs text-gray-500 truncate">
                +{events.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const today = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-lg">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <p className="text-gray-600 font-medium">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="p-6 bg-white rounded-xl shadow-lg max-w-md">
          <div className="flex items-center gap-3 text-red-500 mb-3">
            <AlertCircle className="h-8 w-8" />
            <h2 className="text-xl font-bold">Error Loading Calendar</h2>
          </div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const eventTypes = {
    Client: { icon: User, color: "blue" },
    Payment: { icon: DollarSign, color: "green" },
    Historic: { icon: Activity, color: "purple" },
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-8 w-8" />
              Calendar
            </h1>
            <p className="text-blue-100 mt-1">
              Track and manage your client appointments, payments, and
              activities
            </p>
          </div>

          {/* Calendar Controls */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>

              <h2 className="text-xl font-semibold text-gray-800 min-w-[160px] text-center">
                {currentMonth.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>

              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>

              <button
                onClick={today}
                className="ml-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="Client">Clients</option>
                  <option value="Payment">Payments</option>
                  <option value="Historic">Historic</option>
                </select>
                <Filter className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="py-2 text-center text-sm font-medium text-gray-700"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">{renderCalendar()}</div>

          {/* Legend */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span className="text-gray-700">Client</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-gray-700">Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-400"></div>
              <span className="text-gray-700">Historic</span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        } w-full sm:w-96 max-w-full z-50 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedDate ? formatDateHeader(selectedDate) : "Event Details"}
          </h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-full hover:bg-gray-200 transition"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          {selectedDate ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {getEventsForDate(selectedDate).length} events
                </span>
                {filter !== "all" && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Filtered: {filter}
                  </span>
                )}
              </div>

              {getEventsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-1">
                    No events found
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {filter !== "all" || searchTerm
                      ? "Try changing your filters or search term"
                      : "There are no events scheduled for this date"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getEventsForDate(selectedDate).map((event, index) => {
                    const EventIcon =
                      eventTypes[event.source]?.icon || CalendarIcon;
                    const colorClass =
                      eventTypes[event.source]?.color || "gray";

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border-l-4 border-${colorClass}-500 bg-white shadow-sm hover:shadow-md transition`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg bg-${colorClass}-100 text-${colorClass}-600`}
                          >
                            <EventIcon className="h-5 w-5" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-gray-900">
                                {event.type}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${colorClass}-100 text-${colorClass}-800`}
                              >
                                {event.source}
                              </span>
                            </div>

                            <p className="text-sm text-gray-700 mb-2">
                              {formatValue(event.date)}
                            </p>

                            <div className="grid grid-cols-1 gap-2 text-sm">
                              <div className="flex items-center">
                                <span className="text-gray-500 w-24">
                                  Client:
                                </span>
                                <span className="text-gray-900 font-medium">
                                  {event.entityName}
                                </span>
                              </div>

                              {event.amount && (
                                <div className="flex items-center">
                                  <span className="text-gray-500 w-24">
                                    Amount:
                                  </span>
                                  <span className="text-gray-900 font-medium">
                                    {event.amount} FCFA
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center">
                                <span className="text-gray-500 w-24">
                                  Entity ID:
                                </span>
                                <span className="text-gray-500">
                                  {event.entityId}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                Select a date to see event details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
