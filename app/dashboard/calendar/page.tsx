"use client";

import { useState, useEffect, SetStateAction } from "react";
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
          throw new Error("Échec de la récupération des dates");
        }
        const data = await response.json();
        setDates(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDates();
  }, []);

  const formatValue = (
    value: string | number | Date | null | undefined
  ): string => {
    if (value === null || value === undefined) return "N/A";

    if (typeof value === "string" && !isNaN(Date.parse(value))) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date.toLocaleString("fr-FR");
    }

    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toLocaleString("fr-FR");
    }

    return String(value); // ✅ Ensures the return is a string
  };

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDateClick = (date: SetStateAction<Date>) => {
    setSelectedDate(date);
    setSidebarOpen(true);
  };

  const getEventsForDate = (date: string | number | Date) => {
    if (!date) return [];

    let filtered = dates.filter(
      (d: { date: string | number | Date }) =>
        d.date &&
        new Date(d.date).toDateString() === new Date(date).toDateString()
    );

    // Appliquer les filtres
    if (filter !== "all") {
      filtered = filtered.filter(
        (d: { source?: string }) => d.source === filter
      );
    }

    // Appliquer la recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d: { entityName?: string; type?: string }) =>
          (d.entityName && d.entityName.toLowerCase().includes(term)) ||
          (d.type && d.type.toLowerCase().includes(term))
      );
    }

    return filtered;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];

    // Ajouter des cellules vides pour les jours avant le début du mois
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="h-20 sm:h-24 md:h-28 border border-gray-100 bg-gray-50 opacity-50"
        ></div>
      );
    }

    // Ajouter des cellules pour chaque jour du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const events = getEventsForDate(date);
      const isToday =
        new Date("2025-05-15T12:18:00Z").toDateString() === date.toDateString();
      const isSelected =
        selectedDate && selectedDate.toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(date)}
          className={`h-20 sm:h-24 md:h-28 border border-gray-100 p-1 sm:p-2 transition-all cursor-pointer relative
                    hover:bg-blue-50 hover:border-blue-200
                    ${isToday ? "bg-blue-50 border-blue-300" : "bg-white"}
                    ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
        >
          <div className="flex justify-between">
            <span
              className={`font-medium text-xs sm:text-sm p-1 rounded-full w-5 sm:w-6 h-5 sm:h-6 flex items-center justify-center
                          ${isToday ? "bg-blue-500 text-white" : ""}`}
            >
              {day}
            </span>
            {events.length > 0 && (
              <span className="text-xs bg-blue-100 rounded-full w-4 sm:w-5 h-4 sm:h-5 flex items-center justify-center text-blue-800 font-bold">
                {events.length}
              </span>
            )}
          </div>

          {/* Afficher jusqu'à 3 indicateurs d'événements */}
          <div className="mt-1 space-y-0.5 sm:space-y-1">
            {events.slice(0, 2).map((event: { source: string }, idx) => (
              <div
                key={idx}
                className={`h-1 sm:h-1.5 rounded-full text-xs truncate
                          ${
                            event.source === "Client"
                              ? "bg-blue-400"
                              : event.source === "Payment"
                                ? "bg-green-400"
                                : "bg-purple-400"
                          }`}
              ></div>
            ))}{" "}
            {events.length > 2 && (
              <div className="text-xs text-gray-500 truncate">
                +{events.length - 2} de plus
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
    setCurrentMonth(new Date("2025-05-15T12:18:00Z"));
    setSelectedDate(new Date("2025-05-15T12:18:00Z"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-3 p-4 sm:p-6 bg-white rounded-xl shadow-lg">
          <Loader2 className="h-8 sm:h-10 w-8 sm:w-10 text-blue-500 animate-spin" />
          <p className="text-gray-600 font-medium text-sm sm:text-base">
            Chargement de votre calendrier...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg max-w-md w-full">
          <div className="flex items-center gap-2 sm:gap-3 text-red-500 mb-3">
            <AlertCircle className="h-6 sm:h-8 w-6 sm:w-8" />
            <h2 className="text-lg sm:text-xl font-bold">
              Erreur lors du chargement du calendrier
            </h2>
          </div>
          <p className="text-gray-700 text-sm sm:text-base">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-3 sm:px-4 py-1 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm sm:text-base"
          >
            Réessayer
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4 sm:mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 sm:p-6 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-6 sm:h-8 w-6 sm:w-8" />
              Calendrier
            </h1>
            <p className="text-blue-100 mt-1 text-sm sm:text-base">
              Suivez et gérez vos rendez-vous clients, paiements et activités
            </p>
          </div>

          {/* Contrôles du calendrier */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-1 sm:p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Mois précédent"
              >
                <ChevronLeft className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600" />
              </button>

              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 min-w-[140px] sm:min-w-[160px] text-center">
                {currentMonth.toLocaleString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>

              <button
                onClick={nextMonth}
                className="p-1 sm:p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Mois suivant"
              >
                <ChevronRight className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600" />
              </button>

              <button
                onClick={today}
                className="ml-2 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
              >
                Aujourd&apos;hui
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 sm:w-56 md:w-64">
                <Search className="h-4 sm:h-5 w-4 sm:w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher des événements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 sm:pl-10 pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                />
              </div>

              <div className="relative w-full sm:w-auto">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-9 sm:pl-10 pr-6 sm:pr-8 py-1.5 sm:py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-40 text-xs sm:text-sm"
                >
                  <option value="all">Tous les types</option>
                  <option value="Client">Clients</option>
                  <option value="Payment">Paiements</option>
                  <option value="Historic">Historique</option>
                </select>
                <Filter className="h-4 sm:h-5 w-4 sm:w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Grille du calendrier */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4 sm:mb-6">
          {/* En-têtes des jours */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs sm:text-sm font-medium text-gray-700"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Jours du calendrier */}
          <div className="grid grid-cols-7">{renderCalendar()}</div>

          {/* Légende */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span className="text-gray-700">Client</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-gray-700">Paiement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-400"></div>
              <span className="text-gray-700">Historique</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barre latérale des détails des événements */}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        } w-full sm:w-80 md:w-96 max-w-full z-50 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">
            {selectedDate
              ? formatDateHeader(selectedDate)
              : "Détails de l'événement"}
          </h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 sm:p-2 rounded-full hover:bg-gray-200 transition"
            aria-label="Fermer la barre latérale"
          >
            <X className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          {selectedDate ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  {getEventsForDate(selectedDate).length} événements
                </span>
                {filter !== "all" && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Filtré :{" "}
                    {filter === "Client"
                      ? "Clients"
                      : filter === "Payment"
                        ? "Paiements"
                        : "Historique"}
                  </span>
                )}
              </div>

              {getEventsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="bg-gray-100 rounded-full w-12 sm:w-16 h-12 sm:h-16 flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="h-6 sm:h-8 w-6 sm:w-8 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-1">
                    Aucun événement trouvé
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {filter !== "all" || searchTerm
                      ? "Essayez de modifier vos filtres ou votre terme de recherche"
                      : "Aucun événement n'est programmé pour cette date"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getEventsForDate(selectedDate).map(
                    (
                      event: {
                        source: keyof typeof eventTypes;
                        type: string;
                        date: Date;
                        subscription?: string;
                        entityName: string;
                        amount?: number;
                      },
                      index
                    ) => {
                      const EventIcon =
                        eventTypes[event.source]?.icon || CalendarIcon;
                      const colorClass =
                        eventTypes[event.source]?.color || "gray";

                      return (
                        <div
                          key={index}
                          className={`p-3 sm:p-4 rounded-xl border-l-4 border-${colorClass}-500 bg-white shadow-sm hover:shadow-md transition`}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div
                              className={`p-2 rounded-lg bg-${colorClass}-100 text-${colorClass}-600`}
                            >
                              <EventIcon className="h-4 sm:h-5 w-4 sm:w-5" />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm sm:text-base text-gray-900">
                                  {event.type === "Start Date"
                                    ? "Date de début"
                                    : "Date de fin"}{" "}
                                  {event.subscription === "Monthly"
                                    ? "Abonnement Mois"
                                    : event.subscription === "Yearly"
                                      ? "Abonnement Année"
                                      : event.subscription === "Daily"
                                        ? "Abonnement Jour"
                                        : event.subscription === "Quarterly"
                                          ? "Abonnement Trimestriel"
                                          : "Inscription"}
                                </span>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${colorClass}-100 text-${colorClass}-800`}
                                >
                                  {event.source === "Client"
                                    ? "Client"
                                    : event.source === "Payment"
                                      ? "Paiement"
                                      : "Historique"}
                                </span>
                              </div>

                              <p className="text-xs sm:text-sm text-gray-700 mb-2">
                                {formatValue(event.date.toString())}
                              </p>

                              <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                                <div className="flex items-center">
                                  <span className="text-gray-500 w-20 sm:w-24">
                                    Client :
                                  </span>
                                  <span className="text-gray-900 font-medium">
                                    {event.entityName ===
                                    "Client created successfully"
                                      ? "Client créé avec succès"
                                      : event.entityName ===
                                          "Payment created successfully"
                                        ? "Paiement créé avec succès"
                                        : event.entityName ===
                                            "Payment deleted successfully"
                                          ? "Paiement supprimé avec succès"
                                          : event.entityName ===
                                              "Client updated successfully"
                                            ? "Client mis à jour avec succès"
                                            : event.entityName ===
                                                "Client deleted successfully"
                                              ? "Client supprimé avec succès"
                                              : event.entityName ===
                                                  "Payment updated successfully"
                                                ? "Paiement mis à jour avec succès"
                                                : event.entityName}
                                  </span>
                                </div>

                                {event.amount && (
                                  <div className="flex items-center">
                                    <span className="text-gray-500 w-20 sm:w-24">
                                      Montant :
                                    </span>
                                    <span className="text-gray-900 font-medium">
                                      {event.amount.toLocaleString("fr-FR")}{" "}
                                      FCFA
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}{" "}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-500 text-sm sm:text-base">
                Sélectionnez une date pour voir les détails des événements.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fond pour mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
