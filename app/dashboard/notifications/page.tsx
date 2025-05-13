"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Clock,
  X,
  Info,
  AlertCircle,
  DollarSign,
  User,
} from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/notification/all-notification`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          const totalItems = data.length > itemsPerPage ? data.length : 10;
          setTotalPages(Math.ceil(totalItems / itemsPerPage));
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [page]);

  // Mark notification as read
  const markAsRead = async (id, event) => {
    // Prevent event bubbling
    event.stopPropagation();

    try {
      const res = await fetch(`/api/notification/${id}`, {
        method: "PATCH",
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, isRead: data.notification.isRead } : n
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch(`/api/notification/mark-all-read`, {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "CLIENT_REGISTERED":
        return <User className="h-5 w-5 text-blue-500" />;
      case "PAYMENT_RECEIVED":
        return <DollarSign className="h-5 w-5 text-emerald-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    // This is a placeholder - you'd typically use a proper date formatting library
    return dateString;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="mt-4 text-gray-600 font-medium">
          Loading notifications...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <Bell className="h-7 w-7 mr-3" />
              Notifications
            </h1>

            <div className="flex items-center space-x-3">
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-black text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark All Read
                </button>
              )}
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium text-black">
                  {notifications.filter((n) => !n.isRead).length} unread
                </span>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="p-4 md:p-6">
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="bg-gray-100 rounded-full p-4 w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <Bell className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-xl font-medium">No notifications yet</p>
                <p className="text-gray-500 mt-2">
                  We'll notify you when something important happens.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-xl p-4 transition-all duration-200 flex ${
                      notification.isRead
                        ? "bg-gray-50"
                        : "bg-white shadow-sm hover:shadow-md"
                    }`}
                  >
                    {/* Icon Column */}
                    <div
                      className={`rounded-full p-3 h-12 w-12 flex items-center justify-center mr-4 ${
                        notification.type === "CLIENT_REGISTERED"
                          ? "bg-blue-100"
                          : "bg-emerald-100"
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-base font-semibold text-gray-900">
                              {notification.type === "CLIENT_REGISTERED"
                                ? "New Client Registered"
                                : "Payment Received"}
                            </h3>
                            {!notification.isRead && (
                              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            <span>{formatDate(notification.createdAt)}</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        {!notification.isRead && (
                          <button
                            onClick={(e) => markAsRead(notification.id, e)}
                            className="ml-4 text-blue-600 hover:text-white flex items-center text-xs font-medium bg-blue-50 hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-colors duration-200"
                            aria-label="Mark as read"
                          >
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-100 p-4 flex justify-center">
              <div className="flex items-center rounded-lg overflow-hidden border border-gray-200">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-2 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 transition-colors duration-200"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="px-4 py-2 bg-white text-gray-700 font-medium border-x border-gray-200">
                  {page} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={page === totalPages}
                  className="px-3 py-2 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 transition-colors duration-200"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
