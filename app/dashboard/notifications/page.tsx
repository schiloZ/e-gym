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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  // Récupérer les notifications
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
        console.error(
          "Erreur lors de la récupération des notifications :",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [page]);

  // Marquer une notification comme lue
  const markAsRead = async (
    id: any,
    event: MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    // Empêcher la propagation de l'événement
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
          {/* En-tête */}
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
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="p-3 sm:p-4 md:p-6">
            {notifications.length === 0 ? (
              <div className="text-center py-12 sm:py-16 text-gray-500">
                <div className="bg-gray-100 rounded-full p-3 sm:p-4 w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Bell className="h-8 sm:h-10 w-8 sm:w-10 text-gray-400" />
                </div>
                <p className="text-lg sm:text-xl font-medium">
                  Aucune notification pour le moment
                </p>
                <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
                  Nous vous informerons lorsqu&apos;un événement important se
                  produira.
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {notifications.map(
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
                      {/* Colonne icône */}
                      <div
                        className={`rounded-full p-2 sm:p-3 h-10 sm:h-12 w-10 sm:w-12 flex items-center justify-center mr-3 sm:mr-4 ${
                          notification.type === "CLIENT_REGISTERED"
                            ? "bg-blue-100"
                            : "bg-emerald-100"
                        }`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Colonne contenu */}
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
                              <span>{formatDate(notification.createdAt)}</span>
                            </div>
                          </div>

                          {/* Bouton d'action */}
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
                )}{" "}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-100 p-3 sm:p-4 flex justify-center">
              <div className="flex items-center rounded-lg overflow-hidden border border-gray-200">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-2 sm:px-3 py-1 sm:py-2 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 sm:h-5 w-4 sm:w-5" />
                </button>
                <span className="px-3 sm:px-4 py-1 sm:py-2 bg-white text-gray-700 font-medium border-x border-gray-200 text-xs sm:text-sm">
                  {page} sur {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={page === totalPages}
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
