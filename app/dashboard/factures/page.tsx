"use client";

import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Plus,
  Trash2,
  DollarSign,
  FileText,
  Calendar,
  TrendingUp,
  Download,
  RefreshCw,
  Filter,
  ChevronDown,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type Bill = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [newBill, setNewBill] = useState<Omit<Bill, "id">>({
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    category: "Services publics",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("mois");
  const [showFilters, setShowFilters] = useState(false);
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

  // Catégories échantillons
  const categories = [
    "Services publics",
    "Loyer",
    "Courses",
    "Divertissement",
    "Transport",
    "Santé",
    "Éducation",
    "Autre",
  ];

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/bills");
        if (!res.ok) throw new Error("Échec de la récupération des factures");
        const data = await res.json();
        setBills(data);
      } catch (err: any) {
        setError(err.message || "Erreur lors de la récupération des factures");
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const addBill = async () => {
    if (!newBill.description || newBill.amount <= 0) {
      setError("Une description et un montant valide sont requis");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBill),
      });
      if (!res.ok) throw new Error("Échec de l'ajout de la facture");
      const data = await res.json();
      if (data.bill) setBills([...bills, data.bill]);
      setNewBill({
        description: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        category: "Services publics",
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout de la facture");
    } finally {
      setLoading(false);
    }
  };

  const deleteBill = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Échec de la suppression de la facture");
      setBills(bills.filter((bill) => bill.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression de la facture");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Préparer les données du graphique
  const chartData = {
    labels: categories,
    datasets: [
      {
        label: "Montant par catégorie",
        data: categories.map((category) =>
          bills
            .filter((bill) => bill.category === category)
            .reduce((sum, bill) => sum + bill.amount, 0)
        ),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgba(37, 99, 235, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return formatCurrency(context.raw);
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  // Fonction pour exporter les factures en CSV
  const exportToCSV = () => {
    const headers = ["Description", "Montant (FCFA)", "Date", "Catégorie"];
    const rows = bills.map((bill) => [
      bill.description,
      bill.amount.toLocaleString("fr-FR"),
      new Date(bill.date).toLocaleDateString("fr-FR"),
      bill.category,
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
      `bills_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.setAttribute("href", url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fonction pour exporter les factures en PDF
  const exportToPDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Add title and export date
      doc.setFontSize(18);
      doc.text("Rapport des Factures", 14, 20);
      doc.setFontSize(12);
      doc.text(
        `Exporté le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString(
          "fr-FR",
          { hour: "2-digit", minute: "2-digit" }
        )}`,
        14,
        28
      );

      // Prepare data for the table
      const headers = ["Description", "Montant (FCFA)", "Date", "Catégorie"];
      const rows = bills.map((bill) => [
        bill.description,
        formatCurrency(bill.amount),
        new Date(bill.date).toLocaleDateString("fr-FR"),
        bill.category,
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
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
        },
        margin: { left: 10, right: 10 },
      });

      // Save the PDF
      doc.save(`bills_export_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center p-6 sm:p-8 bg-white rounded-xl shadow-lg">
          <RefreshCw className="h-10 sm:h-12 w-10 sm:w-12 text-blue-500 animate-spin mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
            Chargement des factures
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600" />
                Gestion des factures
              </h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                Suivi et gestion de vos dépenses
              </p>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex items-center gap-2 text-sm sm:text-base"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtres</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showFilters && (
                  <div className="absolute right-0 mt-1 sm:mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg py-1 sm:py-2 z-10 border border-gray-100">
                    <button
                      onClick={() => {
                        setTimeRange("semaine");
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 sm:px-4 py-1.5 hover:bg-gray-50 ${
                        timeRange === "semaine"
                          ? "text-blue-600 font-medium"
                          : "text-gray-700"
                      } text-xs sm:text-sm`}
                    >
                      Derniers 7 jours
                    </button>
                    <button
                      onClick={() => {
                        setTimeRange("mois");
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 sm:px-4 py-1.5 hover:bg-gray-50 ${
                        timeRange === "mois"
                          ? "text-blue-600 font-medium"
                          : "text-gray-700"
                      } text-xs sm:text-sm`}
                    >
                      Derniers 30 jours
                    </button>
                    <button
                      onClick={() => {
                        setTimeRange("année");
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 sm:px-4 py-1.5 hover:bg-gray-50 ${
                        timeRange === "année"
                          ? "text-blue-600 font-medium"
                          : "text-gray-700"
                      } text-xs sm:text-sm`}
                    >
                      Derniers 12 mois
                    </button>
                  </div>
                )}
              </div>
              {isStandardPlan && (
                <>
                  <button
                    onClick={() => {
                      exportToCSV();
                    }}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Exporter en CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      exportToPDF(); // Export both CSV and PDF
                    }}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Exporter en PDF</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Formulaire d'ajout de facture */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm lg:col-span-1">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              Ajouter une nouvelle facture
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  value={newBill.description}
                  onChange={(e) =>
                    setNewBill({ ...newBill, description: e.target.value })
                  }
                  placeholder="Facture d'électricité"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Montant (FCFA)
                </label>
                <input
                  type="number"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  value={newBill.amount || ""}
                  onChange={(e) =>
                    setNewBill({ ...newBill, amount: Number(e.target.value) })
                  }
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  value={newBill.date}
                  onChange={(e) =>
                    setNewBill({ ...newBill, date: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  value={newBill.category}
                  onChange={(e) =>
                    setNewBill({ ...newBill, category: e.target.value })
                  }
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={addBill}
                className="w-full py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm sm:text-base"
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
                Ajouter une facture
              </button>
              {error && (
                <p className="text-red-500 text-xs sm:text-sm mt-2">{error}</p>
              )}
            </div>
          </div>

          {/* Liste des factures et statistiques */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Cartes de résumé */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">
                      Total des factures
                    </p>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      {bills.length}
                    </h3>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
                    <FileText className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">
                      Montant total
                    </p>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      {formatCurrency(totalAmount)}
                    </h3>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg">
                    <DollarSign className="h-4 sm:h-5 w-4 sm:w-5 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">
                      Facture moyenne
                    </p>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      {bills.length > 0
                        ? formatCurrency(totalAmount / bills.length)
                        : formatCurrency(0)}
                    </h3>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg">
                    <TrendingUp className="h-4 sm:h-5 w-4 sm:w-5 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des factures */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Factures récentes
              </h2>
              {bills.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  Aucune facture ajoutée pour le moment
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Catégorie
                        </th>
                        <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bills.map((bill) => (
                        <tr key={bill.id}>
                          <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {bill.description}
                          </td>
                          <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Date(bill.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap text-sm text-gray-500">
                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {bill.category}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(bill.amount)}
                          </td>
                          <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => deleteBill(bill.id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 sm:px-6 py-2 sm:py-3 text-right text-sm font-medium text-gray-500 uppercase"
                        >
                          Total
                        </td>
                        <td className="px-4 sm:px-6 py-2 sm:py-3 text-sm font-bold text-gray-900">
                          {formatCurrency(totalAmount)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Graphique */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Dépenses par catégorie
              </h2>
              <div className="h-48 sm:h-64">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
