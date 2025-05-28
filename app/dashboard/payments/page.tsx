"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  CreditCard,
  Search,
  ArrowRight,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function PaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [companyInfo, setCompanyInfo] = useState<{
    subscriptionType: string | null;
  } | null>(null);
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch("/api/company/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch company details");
        }

        const data = await response.json();
        setCompanyInfo({
          ...data,
        });
      } catch (err: unknown) {
        toast.error((err as Error).message, { duration: 4000 });
      }
    };
    fetchCompanyInfo();
  }, []);
  const isStandardPlan = companyInfo?.subscriptionType !== "free";

  // Récupérer les paiements au montage
  useEffect(() => {
    const fetchPayments = async () => {
      if (status === "loading") return;
      if (!session) {
        router.push("/");
        return;
      }

      try {
        const response = await fetch("/api/payments");
        const data = await response.json();
        setPayments(data);
        setFilteredPayments(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des paiements :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [session, status, router]);

  // Gérer la recherche
  useEffect(() => {
    const filtered = payments.filter(
      (payment) =>
        payment.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.subscription
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        payment.amount.toString().includes(searchQuery) ||
        payment.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPayments(filtered);
    setCurrentPage(1);
  }, [searchQuery, payments]);

  // Gérer la suppression d'un paiement
  const handleDelete = async (paymentId) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce paiement ?")) {
      try {
        await fetch(`/api/payments/${paymentId}`, {
          method: "DELETE",
        });
        setPayments(payments.filter((payment) => payment.id !== paymentId));
        setFilteredPayments(
          filteredPayments.filter((payment) => payment.id !== paymentId)
        );
        toast.success("Paiement supprimé avec succès !");
      } catch (error) {
        console.error("Erreur lors de la suppression du paiement :", error);
      }
    }
  };

  // Fonction pour exporter les données en CSV
  const exportToCSV = () => {
    const headers = [
      "Client",
      "Montant (FCFA)",
      "Abonnement",
      "Statut",
      "Date",
      "Date de début",
      "Date de fin",
    ];
    const rows = paginatedPayments.map((payment) => [
      payment.client.name,
      payment.amount,
      (() => {
        const translations: Record<string, string> = {
          Daily: "Quotidien",
          Weekly: "Hebdomadaire",
          Monthly: "Mensuel",
          Quarterly: "Trimestriel",
          Yearly: "Annuel",
        };
        return translations[payment.subscription] || payment.subscription;
      })(),
      payment.status === "Completed" ? "Payé" : payment.status || "N/A",
      new Date(payment.date).toLocaleDateString("fr-FR"),
      payment.startDate
        ? new Date(payment.startDate).toLocaleDateString("fr-FR")
        : "N/A",
      payment.endDate
        ? new Date(payment.endDate).toLocaleDateString("fr-FR")
        : "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute(
      "download",
      `payments_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.setAttribute("href", url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fonction pour exporter les données en PDF
  const exportToPDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Add title and export date
      doc.setFontSize(18);
      doc.text("Rapport des Paiements", 14, 20);
      doc.setFontSize(12);
      doc.text(
        `Exporté le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString(
          "fr-FR",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        )}`,
        14,
        28
      );

      // Prepare data for the table
      const headers = [
        "Client",
        "Montant (FCFA)",
        "Abonnement",
        "Statut",
        "Date",
        "Date de début",
        "Date de fin",
      ];
      const rows = paginatedPayments.map((payment) => [
        payment.client.name,
        payment.amount,
        (() => {
          const translations: Record<string, string> = {
            Daily: "Quotidien",
            Weekly: "Hebdomadaire",
            Monthly: "Mensuel",
            Quarterly: "Trimestriel",
            Yearly: "Annuel",
          };
          return translations[payment.subscription] || payment.subscription;
        })(),
        payment.status === "Completed" ? "Payé" : payment.status || "N/A",
        new Date(payment.date).toLocaleDateString("fr-FR"),
        payment.startDate
          ? new Date(payment.startDate).toLocaleDateString("fr-FR")
          : "N/A",
        payment.endDate
          ? new Date(payment.endDate).toLocaleDateString("fr-FR")
          : "N/A",
      ]);

      // Add the table
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 35,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 },
        },
        margin: { left: 10, right: 10 },
      });

      // Save the PDF
      doc.save(`payments_export_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        Chargement...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-green-600 to-green-800 p-4 sm:p-6 rounded-xl text-white shadow-lg">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
            <CreditCard className="h-5 sm:h-6 md:h-7 w-5 sm:w-6 md:w-7 mr-2" />
            Paiements
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-green-100">
            Suivez vos transactions financières
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard/payments/new"
            className="bg-white text-green-600 hover:bg-green-50 py-2 px-3 sm:px-4 rounded-lg font-medium flex items-center gap-2 text-xs sm:text-sm md:text-base transition shadow-md w-full sm:w-auto"
          >
            <CreditCard className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6" />
            Nouveau paiement
          </Link>
          {isStandardPlan && (
            <>
              <button
                onClick={exportToCSV}
                className="bg-white text-green-600 hover:bg-green-50 py-2 px-3 sm:px-4 rounded-lg font-medium flex items-center gap-2 text-xs sm:text-sm md:text-base transition shadow-md w-full sm:w-auto"
              >
                <CreditCard className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6" />
                Exporter en CSV
              </button>
              <button
                onClick={exportToPDF}
                className="bg-white text-green-600 hover:bg-green-50 py-2 px-3 sm:px-4 rounded-lg font-medium flex items-center gap-2 text-xs sm:text-sm md:text-base transition shadow-md w-full sm:w-auto"
              >
                <CreditCard className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6" />
                Exporter en PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Recherche et filtres */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <div className="relative mb-3 sm:mb-4 md:mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-gray-50 text-xs sm:text-sm md:text-base"
            placeholder="Rechercher par client, abonnement, montant ou statut..."
          />
        </div>
      </div>

      {/* Liste des paiements */}
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md overflow-hidden">
        <div className="space-y-3 sm:space-y-4">
          {paginatedPayments.length === 0 ? (
            <div className="text-gray-500 text-center py-6 sm:py-8 md:py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <CreditCard className="h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-xs sm:text-sm md:text-base">
                Aucun paiement trouvé
              </p>
              <p className="text-xs sm:text-sm mt-1">
                Utilisez la barre de recherche ou ajoutez un nouveau paiement
                pour commencer
              </p>
            </div>
          ) : (
            paginatedPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition border border-gray-100 hover:border-green-200"
              >
                <div className="mb-2 sm:mb-0">
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base">
                    {payment.client.name}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 mt-1">
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                      <span className="text-green-500">💰</span>{" "}
                      {payment.amount.toLocaleString("fr-FR")} FCFA
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                      <span className="text-green-500">📅</span>{" "}
                      {new Date(payment.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <span className="text-green-500">🔔</span> Statut :{" "}
                    {payment.status === "Pending" ? (
                      <span className="text-yellow-500">En attente</span>
                    ) : payment.status === "Completed" ? (
                      <span className="text-green-500">Payé</span>
                    ) : (
                      <span className="text-red-500">Annulé</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  <Link
                    href={`/dashboard/payments/${payment.id}`}
                    className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 transition w-full sm:w-auto"
                  >
                    <Eye className="h-3 sm:h-4 w-3 sm:w-4" />
                    Voir
                  </Link>
                  <Link
                    href={`/dashboard/payments/${payment.id}/edit`}
                    className="text-yellow-600 hover:text-yellow-800 bg-yellow-50 hover:bg-yellow-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 transition w-full sm:w-auto"
                  >
                    <Edit className="h-3 sm:h-4 w-3 sm:w-4" />
                    Modifier
                  </Link>
                  <button
                    onClick={() => handleDelete(payment.id)}
                    className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 transition w-full sm:w-auto"
                  >
                    <Trash2 className="h-3 sm:h-4 w-3 sm:w-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {filteredPayments.length > 0 && (
          <div className="mt-4 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                className={`p-2 rounded-lg border ${
                  currentPage === 1
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-200 hover:bg-gray-50 transition"
                }`}
                disabled={currentPage === 1}
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === page
                        ? "bg-green-500 text-white font-medium"
                        : "border border-gray-200 hover:bg-gray-50 transition"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={handleNextPage}
                className={`p-2 rounded-lg border ${
                  currentPage === totalPages
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-200 hover:bg-gray-50 transition"
                }`}
                disabled={currentPage === totalPages}
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
