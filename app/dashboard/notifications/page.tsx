"use client";

import { useState, useEffect, MouseEvent } from "react";
import {
  Bell,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Info,
  DollarSign,
  User,
} from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any>([]);
  const [overduePayments, setOverduePayments] = useState<any[]>([]);
  const [notificationPage, setNotificationPage] = useState(1);
  const [overduePage, setOverduePage] = useState(1);
  const [notificationTotalPages, setNotificationTotalPages] = useState(1);
  const [overdueTotalPages, setOverdueTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 5; // 5 records per page
  const [activeTab, setActiveTab] = useState<"notifications" | "overdue">(
    "notifications"
  );

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/notification/all-notification`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          setNotificationTotalPages(Math.ceil(data.length / itemsPerPage));
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des notifications :",
          error
        );
      }
      setLoading(false);
    };

    // Fetch overdue payments
    const fetchOverduePayments = async () => {
      try {
        const res = await fetch(`/api/payments/overdue`);
        if (res.ok) {
          const data = await res.json();
          console.log("Overdue Payments Data:", data);
          setOverduePayments(data);
          // Calculate total pages based on grouped data
          const grouped = groupByMonth(data);
          const totalItems = Object.values(grouped).reduce(
            (sum, monthPayments) => sum + monthPayments.length,
            0
          );
          setOverdueTotalPages(Math.ceil(totalItems / itemsPerPage));
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des paiements en retard :",
          error
        );
      }
    };

    fetchNotifications();
    fetchOverduePayments();
  }, []);

  // Get paginated notifications
  const getPaginatedNotifications = () => {
    const startIndex = (notificationPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return notifications.slice(startIndex, endIndex);
  };

  // Get paginated overdue payments with month grouping
  const getPaginatedOverduePayments = () => {
    const grouped = groupByMonth(overduePayments);
    const allPayments = Object.values(grouped).flat();
    const startIndex = (overduePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPayments = allPayments.slice(startIndex, endIndex);

    // Re-group paginated payments by month
    return paginatedPayments.reduce(
      (acc: { [key: string]: any[] }, payment: any) => {
        const monthYear = new Date(payment.endDate).toLocaleString("fr-FR", {
          month: "long",
          year: "numeric",
        });
        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(payment);
        return acc;
      },
      {}
    );
  };

  // Mark a notification as read
  const markAsRead = async (id: any, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    try {
      const res = await fetch(`/api/notification/${id}`, {
        method: "PATCH",
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications((prev: any[]) =>
          prev.map((n) =>
            n.id === id ? { ...n, isRead: data.notification.isRead } : n
          )
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors du marquage de la notification comme lue :",
        error
      );
    }
  };

  const getNotificationIcon = (type: any) => {
    switch (type) {
      case "CLIENT_REGISTERED":
        return <User className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />;
      case "PAYMENT_RECEIVED":
        return (
          <DollarSign className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-500" />
        );
      default:
        return <Info className="h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group overdue payments by month
  const groupByMonth = (payments: any[]) => {
    return payments.reduce((acc: { [key: string]: any[] }, payment: any) => {
      const monthYear = new Date(payment.endDate).toLocaleString("fr-FR", {
        month: "long",
        year: "numeric",
      });
      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(payment);
      return acc;
    }, {});
  };

  // Reset page when switching tabs
  const handleTabChange = (tab: "notifications" | "overdue") => {
    setActiveTab(tab);
    if (tab === "notifications") {
      setNotificationPage(1);
    } else {
      setOverduePage(1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-8 sm:h-10 w-8 sm:w-10 animate-spin text-blue-600" />
        <span className="mt-3 sm:mt-4 text-gray-600 font-medium text-sm sm:text-base">
          Chargement des notifications...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* En-tête avec toggle */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center">
              <Bell className="h-6 sm:h-7 w-6 sm:w-7 mr-2 sm:mr-3" />
              Notifications
            </h1>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="bg-white bg-opacity-20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">
                <span className="text-xs sm:text-sm font-medium text-black">
                  {
                    notifications.filter((n: { isRead: boolean }) => !n.isRead)
                      .length
                  }{" "}
                  non lu(s){" "}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleTabChange("notifications")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    activeTab === "notifications"
                      ? "bg-white text-blue-600"
                      : "text-white hover:bg-white hover:text-black hover:bg-opacity-20"
                  }`}
                >
                  Notifications
                </button>
                <button
                  onClick={() => handleTabChange("overdue")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    activeTab === "overdue"
                      ? "bg-white text-red-600"
                      : "text-white hover:bg-white hover:text-black hover:bg-opacity-20"
                  }`}
                >
                  Fin d&apos;abonnement
                </button>
              </div>
            </div>
          </div>

          {/* Contenu selon l'onglet actif */}
          <div className="p-3 sm:p-4 md:p-6">
            {activeTab === "notifications" ? (
              notifications.length === 0 ? (
                <div className="text-center py-12 sm:py-16 text-gray-500">
                  <div className="bg-gray-100 rounded-full p-3 sm:p-4 w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Bell className="h-8 sm:h-10 w-8 sm:w-10 text-gray-400" />
                  </div>
                  <p className="text-lg sm:text-xl font-medium">
                    Aucune notification pour le moment
                  </p>
                  <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
                    Nous vous informerons lorsqu&lsquo;un événement important se
                    produira.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {getPaginatedNotifications().map(
                    (notification: {
                      id: string;
                      isRead: boolean;
                      type: string;
                      message: string;
                      createdAt: Date;
                    }) => (
                      <div
                        key={notification.id}
                        className={`rounded-xl p-3 sm:p-4 transition-all duration-200 flex ${
                          notification.isRead
                            ? "bg-gray-50"
                            : "bg-white shadow-sm hover:shadow-md"
                        }`}
                      >
                        <div
                          className={`rounded-full p-2 sm:p-3 h-10 sm:h-12 w-10 sm:w-12 flex items-center justify-center mr-3 sm:mr-4 ${
                            notification.type === "CLIENT_REGISTERED"
                              ? "bg-blue-100"
                              : "bg-emerald-100"
                          }`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 sm:gap-0">
                            <div>
                              <div className="flex items-center">
                                <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                                  {notification.type === "CLIENT_REGISTERED"
                                    ? "Nouveau client enregistré"
                                    : "Paiement reçu"}
                                </h3>
                                {!notification.isRead && (
                                  <span className="ml-1 sm:ml-2 bg-blue-100 text-blue-800 text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium">
                                    Nouveau
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-700 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center mt-1 sm:mt-2 text-xs text-gray-500">
                                <Calendar className="h-3 sm:h-3.5 w-3 sm:w-3.5 mr-1" />
                                <span>
                                  {formatDate(notification.createdAt)}
                                </span>
                              </div>
                            </div>
                            {!notification.isRead && (
                              <button
                                onClick={(e: any) =>
                                  markAsRead(notification.id, e)
                                }
                                className="ml-0 sm:ml-4 text-blue-600 hover:text-white flex items-center text-xs font-medium bg-blue-50 hover:bg-blue-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors duration-200"
                                aria-label="Marquer comme lu"
                              >
                                <CheckCircle className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-1.5" />
                                Lu
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )
            ) : overduePayments.length === 0 ? (
              <div className="text-center py-12 sm:py-16 text-gray-500">
                <div className="bg-gray-100 rounded-full p-3 sm:p-4 w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <DollarSign className="h-8 sm:h-10 w-8 sm:w-10 text-gray-400" />
                </div>
                <p className="text-lg sm:text-xl font-medium">
                  Aucune fin d&apos;abonnement en retard
                </p>
                <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
                  Tous les abonnements sont à jour pour le moment.
                </p>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                {Object.entries(getPaginatedOverduePayments()).map(
                  ([monthYear, payments]: [string, any[]]) => (
                    <div key={monthYear}>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                        {monthYear}
                      </h2>
                      <div className="space-y-3 sm:space-y-4">
                        {payments.map((payment: any, index: number) => (
                          <div
                            key={index}
                            className="rounded-xl p-3 sm:p-4 bg-red-50 shadow-sm hover:shadow-md transition-all duration-200 flex"
                          >
                            <div className="rounded-full p-2 sm:p-3 h-10 sm:h-12 w-10 sm:w-12 flex items-center justify-center mr-3 sm:mr-4 bg-red-100">
                              <DollarSign className="h-4 sm:h-5 w-4 sm:w-5 text-red-500" />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 sm:gap-0">
                                <div>
                                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                                    Abonnement terminé pour {payment.clientName}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-gray-700 mt-1">
                                    L&apos;abonnement a pris fin le{" "}
                                    {formatDate(payment.endDate)} depuis{" "}
                                    {payment.daysOverdue} jour(s).
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Pagination for notifications */}
          {activeTab === "notifications" && notificationTotalPages > 1 && (
            <div className="border-t border-gray-100 p-3 sm:p-4 flex justify-center">
              <div className="flex items-center rounded-lg overflow-hidden border border-gray-200">
                <button
                  onClick={() =>
                    setNotificationPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={notificationPage === 1}
                  className="px-2 sm:px-3 py-1 sm:py-2 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 sm:h-5 w-4 sm:w-5" />
                </button>
                <span className="px-3 sm:px-4 py-1 sm:py-2 bg-white text-gray-700 font-medium border-x border-gray-200 text-xs sm:text-sm">
                  {notificationPage} sur {notificationTotalPages}
                </span>
                <button
                  onClick={() =>
                    setNotificationPage((prev) =>
                      Math.min(prev + 1, notificationTotalPages)
                    )
                  }
                  disabled={notificationPage === notificationTotalPages}
                  className="px-2 sm:px-3 py-1 sm:py-2 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 transition-colors duration-200"
                >
                  <ChevronRight className="h-4 sm:h-5 w-4 sm:w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Pagination for overdue payments */}
          {activeTab === "overdue" && overdueTotalPages > 1 && (
            <div className="border-t border-gray-100 p-3 sm:p-4 flex justify-center">
              <div className="flex items-center rounded-lg overflow-hidden border border-gray-200">
                <button
                  onClick={() =>
                    setOverduePage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={overduePage === 1}
                  className="px-2 sm:px-3 py-1 sm:py-2 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 sm:h-5 w-4 sm:w-5" />
                </button>
                <span className="px-3 sm:px-4 py-1 sm:py-2 bg-white text-gray-700 font-medium border-x border-gray-200 text-xs sm:text-sm">
                  {overduePage} sur {overdueTotalPages}
                </span>
                <button
                  onClick={() =>
                    setOverduePage((prev) =>
                      Math.min(prev + 1, overdueTotalPages)
                    )
                  }
                  disabled={overduePage === overdueTotalPages}
                  className="px-2 sm:px-3 py-1 sm:py-2 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 transition-colors duration-200"
                >
                  <ChevronRight className="h-4 sm:h-5 w-4 sm:w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Group overdue payments by month
function groupByMonth(payments: any[]) {
  return payments.reduce((acc: { [key: string]: any[] }, payment: any) => {
    const monthYear = new Date(payment.endDate).toLocaleString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(payment);
    return acc;
  }, {});
}
