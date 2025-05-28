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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Fixé à 5 enregistrements par page

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch("/api/historic");
        if (!response.ok) {
          throw new Error("Échec de la récupération des entrées d'historique");
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
        throw new Error("Échec de la récupération des entrées d'historique");
      }
      const data = await response.json();
      setHistoryEntries(data);
      setCurrentPage(1); // Réinitialiser à la première page lors du rafraîchissement
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
      return date.toLocaleString("fr-FR") || value;
    }
    if (value instanceof Date && !isNaN(value)) {
      return value.toLocaleString("fr-FR");
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
    if (filterType !== "all" && entry.action !== filterType) {
      return false;
    }
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

  // Logique de pagination
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = filteredEntries.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-6 sm:p-8 bg-white rounded-xl shadow-lg">
          <Loader2 className="h-10 sm:h-12 w-10 sm:w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-sm sm:text-base">
            Chargement de l'historique d'activité...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-6 sm:p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
          <AlertCircle className="h-10 sm:h-12 w-10 sm:w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
            Une erreur s'est produite
          </h3>
          <p className="text-red-500 mb-4 text-sm sm:text-base">{error}</p>
          <button
            onClick={refreshData}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center justify-center gap-2 mx-auto text-sm sm:text-base"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-600 to-blue-600 p-6 sm:p-8 rounded-2xl text-white shadow-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Activity className="h-6 sm:h-8 w-6 sm:w-8" />
              Historique d'activité
            </h1>
            <p className="text-indigo-100 mt-1 text-base sm:text-lg">
              Suivez toutes les actions et modifications dans votre système
            </p>
          </div>
          <button
            onClick={refreshData}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition flex items-center gap-2 text-sm sm:text-base"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Rafraîchir les données
          </button>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-start md:items-center">
            <div className="relative flex-grow max-w-xs sm:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                <Search className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher des activités..."
                className="block w-full pl-8 sm:pl-10 pr-4 py-1.5 sm:py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Réinitialiser à la première page lors d'une nouvelle recherche
                }}
              />
            </div>

            <div className="flex gap-1 sm:gap-2 self-start md:self-auto">
              <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 p-0.5 sm:p-1 rounded-lg">
                <button
                  className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition ${
                    filterType === "all"
                      ? "bg-white shadow text-blue-600"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => {
                    setFilterType("all");
                    setCurrentPage(1); // Réinitialiser à la première page lors d'un nouveau filtre
                  }}
                >
                  Tous
                </button>
                <button
                  className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition flex items-center gap-1 ${
                    filterType === "CREATE"
                      ? "bg-white shadow text-green-600"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => {
                    setFilterType("CREATE");
                    setCurrentPage(1); // Réinitialiser à la première page lors d'un nouveau filtre
                  }}
                >
                  <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Créer
                </button>
                <button
                  className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition flex items-center gap-1 ${
                    filterType === "UPDATE"
                      ? "bg-white shadow text-blue-600"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => {
                    setFilterType("UPDATE");
                    setCurrentPage(1); // Réinitialiser à la première page lors d'un nouveau filtre
                  }}
                >
                  <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Mettre à jour
                </button>
                <button
                  className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition flex items-center gap-1 ${
                    filterType === "DELETE"
                      ? "bg-white shadow text-red-600"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => {
                    setFilterType("DELETE");
                    setCurrentPage(1); // Réinitialiser à la première page lors d'un nouveau filtre
                  }}
                >
                  <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Entrées d'historique */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                <Activity className="h-4 sm:h-5 w-4 sm:w-5 mr-2 text-blue-500" />
                Activité récente
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {filteredEntries.length}{" "}
                {filteredEntries.length === 1 ? "entrée" : "entrées"} trouvées
              </p>
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="text-gray-500 text-center py-12 sm:py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Activity className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-sm sm:text-base">
                Aucune activité correspondante trouvée
              </p>
              <p className="text-xs sm:text-sm mt-1">
                {searchTerm || filterType !== "all"
                  ? "Essayez de modifier votre recherche ou vos filtres"
                  : "Les actions apparaîtront ici une fois que vous ferez des modifications"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {paginatedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 sm:p-5 bg-white rounded-xl transition border border-gray-100 hover:border-blue-200 hover:shadow-md group relative overflow-hidden"
                >
                  {/* Bandeau indicateur de couleur */}
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
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <span
                          className={`inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium border ${getActionColor(
                            entry.action
                          )}`}
                        >
                          <span className="mr-1">
                            {getActionIcon(entry.action)}
                          </span>
                          {entry.action === "CREATE"
                            ? "Créer"
                            : entry.action === "UPDATE"
                              ? "Mettre à jour"
                              : "Supprimer"}
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-800 bg-gray-100 px-2 sm:px-2.5 py-1 rounded-full">
                          {entry.entityType === "BILL"
                            ? "Facture"
                            : entry.entityType === "PAYMENT"
                              ? "Payement"
                              : "Creation"}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-gray-900 font-medium">
                        {entry.description === "Client created successfully"
                          ? "Client créé avec succès"
                          : entry.description === "Payment created successfully"
                            ? "Paiement créé avec succès"
                            : entry.description ===
                                "Payment deleted successfully"
                              ? "Paiement supprimé avec succès"
                              : entry.description ===
                                  "Client updated successfully"
                                ? "Client mis à jour avec succès"
                                : entry.description ===
                                    "Client deleted successfully"
                                  ? "Client supprimé avec succès"
                                  : entry.description ===
                                      "Payment updated successfully"
                                    ? "Paiement mis à jour avec succès"
                                    : entry.description ===
                                        "Bill created successfully"
                                      ? "Facture créée avec succès"
                                      : entry.description ===
                                          "Bill deleted successfully"
                                        ? "Facture supprimée avec succès"
                                        : entry.description}
                      </p>

                      <div className="mt-2 sm:mt-3 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-3 sm:gap-x-4">
                        {entry.client && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 sm:px-3 py-1.5 rounded-lg">
                            <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500 flex-shrink-0" />
                            <div className="truncate">
                              <span className="font-medium">Client :</span>{" "}
                              {entry.client.name} ({entry.client.email})
                            </div>
                          </div>
                        )}

                        {entry.payment && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 sm:px-3 py-1.5 rounded-lg">
                            <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500 flex-shrink-0" />
                            <div className="truncate">
                              <span className="font-medium">Paiement :</span>{" "}
                              {entry.payment.amount} FCFA -{" "}
                              {(() => {
                                const translations: Record<string, string> = {
                                  Daily: "Quotidien",
                                  Weekly: "Hebdomadaire",
                                  Monthly: "Mensuel",
                                  Quarterly: "Trimestriel",
                                  Yearly: "Annuel",
                                };
                                return (
                                  translations[entry.payment.subscription] ||
                                  entry.payment.subscription
                                );
                              })()}
                              (
                              {entry.payment.status === "Pending" ? (
                                <span className="text-yellow-500">
                                  En attente
                                </span>
                              ) : entry.payment.status === "Completed" ? (
                                <span className="text-green-500">Payé</span>
                              ) : (
                                <span className="text-red-500">Annulé</span>
                              )}
                              )
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-3 text-xs sm:text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
                          {new Date(entry.createdAt).toLocaleString("fr-FR")}
                        </div>

                        <div className="flex items-center gap-1 text-gray-500">
                          <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
                          {entry.changedBy.username}
                        </div>
                      </div>
                    </div>

                    {(entry.oldData || entry.newData) && (
                      <button
                        onClick={() => toggleRow(entry.id)}
                        className="text-blue-600 hover:text-blue-800 flex items-center text-sm sm:text-base font-medium bg-blue-50 hover:bg-blue-100 transition px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg"
                      >
                        {expandedRows[entry.id] ? (
                          <>
                            <ChevronUp className="h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1" />
                            Masquer
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1" />
                            Détails
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {expandedRows[entry.id] && (
                    <div className="mt-4 sm:mt-5 border-t border-gray-100 pt-4 sm:pt-5 pl-3">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {entry.oldData && (
                          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
                            <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                              <span className="bg-gray-200 text-gray-700 px-1.5 sm:px-2 py-1 rounded-md text-xs sm:text-sm flex items-center gap-1">
                                <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{" "}
                                Données précédentes
                              </span>
                            </h4>
                            <div className="space-y-1 sm:space-y-2">
                              {Object.entries(entry.oldData).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex items-center gap-2 p-2 sm:p-2.5 bg-white rounded-lg border border-gray-100 group-hover:border-gray-200 transition"
                                  >
                                    {getIconForField(key)}
                                    <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-24 sm:min-w-28">
                                      {key
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, (str) =>
                                          str.toUpperCase()
                                        )}
                                      :
                                    </span>
                                    <span className="text-xs sm:text-sm text-gray-600 bg-gray-50 px-1.5 sm:px-2 py-1 rounded flex-grow break-all">
                                      {formatValue(value)}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {entry.newData && (
                          <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-100">
                            <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-700 px-1.5 sm:px-2 py-1 rounded-md text-xs sm:text-sm flex items-center gap-1">
                                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{" "}
                                Données actuelles
                              </span>
                            </h4>
                            <div className="space-y-1 sm:space-y-2">
                              {Object.entries(entry.newData).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex items-center gap-2 p-2 sm:p-2.5 bg-white rounded-lg border border-blue-100 group-hover:border-blue-200 transition"
                                  >
                                    {getIconForField(key)}
                                    <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-24 sm:min-w-28">
                                      {key
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, (str) =>
                                          str.toUpperCase()
                                        )}
                                      :
                                    </span>
                                    <span className="text-xs sm:text-sm text-gray-600 bg-blue-50 px-1.5 sm:px-2 py-1 rounded flex-grow break-all">
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

          {/* Contrôles de pagination */}
          {filteredEntries.length > 0 && (
            <div className="mt-6 sm:mt-8 flex justify-center">
              <nav className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={handlePrevPage}
                  className={`p-1 sm:p-2 rounded-lg border ${
                    currentPage === 1
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-gray-200 hover:bg-gray-50 transition"
                  }`}
                  disabled={currentPage === 1}
                >
                  <ChevronDown className="h-3.5 sm:h-4 w-3.5 sm:w-4 rotate-90" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-2 sm:px-3 py-1 rounded-lg ${
                        currentPage === page
                          ? "bg-blue-500 text-white font-medium"
                          : "border border-gray-200 hover:bg-gray-50 transition"
                      } text-xs sm:text-sm`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={handleNextPage}
                  className={`p-1 sm:p-2 rounded-lg border ${
                    currentPage === totalPages
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-gray-200 hover:bg-gray-50 transition"
                  }`}
                  disabled={currentPage === totalPages}
                >
                  <ChevronUp className="h-3.5 sm:h-4 w-3.5 sm:w-4 rotate-90" />
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
