"use client";

import { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
import toast from "react-hot-toast";

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
    billsAmountPerDay: [],
    activeSubscriptionsPerDay: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("week"); // semaine, mois, année, tout
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

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [registrations, payments, amounts, bills, subscriptions] =
        await Promise.all([
          fetch("/api/stats/registrations-per-day").then((res) => res.json()),
          fetch("/api/stats/payments-per-day").then((res) => res.json()),
          fetch("/api/stats/payment-amount-per-day").then((res) => res.json()),
          fetch("/api/stats/bills-amount-per-day").then((res) => res.json()),
          fetch("/api/stats/active-subscriptions-per-day").then((res) =>
            res.json()
          ),
        ]);
      setStats({
        registrationsPerDay: registrations,
        paymentsPerDay: payments,
        paymentAmountPerDay: amounts,
        billsAmountPerDay: bills,
        activeSubscriptionsPerDay: subscriptions,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques récapitulatives pour les cartes de métriques
  const getTotalRegistrations = () => {
    return stats.registrationsPerDay.reduce(
      (sum, day: any) => sum + day.count,
      0
    );
  };

  const getPaymentDayCount = () => {
    if (!stats.paymentsPerDay || !Array.isArray(stats.paymentsPerDay)) {
      console.warn("stats.paymentsPerDay is invalid or empty");
      return 0;
    }
    return stats.paymentsPerDay.length;
  };

  const getTotalPaymentAmount = () => {
    return stats.paymentAmountPerDay.reduce(
      (sum, day: any) => sum + day.totalAmount,
      0
    );
  };

  const getTotalBillsAmount = () => {
    return stats.billsAmountPerDay.reduce(
      (sum, day: any) => sum + day.totalAmount,
      0
    );
  };

  const getTotalRevenue = () => {
    const totalPayments = getTotalPaymentAmount();
    const totalBills = getTotalBillsAmount();
    return totalPayments - totalBills;
  };

  const getAverageTransactionValue = () => {
    const totalPayments = getTotalPaymentAmount();
    const paymentCount = getPaymentDayCount();
    return paymentCount > 0 ? totalPayments / paymentCount : 0;
  };

  const getActiveSubscriptionsTrend = () => {
    const subscriptions = stats.activeSubscriptionsPerDay || [];
    if (subscriptions.length === 0) {
      return 0;
    }

    // Get the current date
    const currentDate = new Date("2025-05-27T12:17:00Z"); // Current time: 12:17 PM GMT on May 27, 2025
    const latestSubscription = subscriptions
      .filter((sub: any) => new Date(sub.date) <= currentDate)
      .reduce(
        (latest: any, current: any) =>
          new Date(latest.date) > new Date(current.date) ? latest : current,
        subscriptions[0]
      );

    return latestSubscription ? latestSubscription.count : 0;
  };

  const formatCurrency = (value: any) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return value;
  };

  // Calculer les tendances (changement en pourcentage)
  const calculateTrend = (data: any, key = "count") => {
    if (!data || data.length < 2) return 0;

    const current = data[data.length - 1][key] || 0;
    const previous = data[data.length - 2][key] || 0;

    if (previous === 0) return 100; // Si précédent était 0, montrer une augmentation de 100%
    return ((current - previous) / previous) * 100;
  };

  // Configurations des graphiques
  const commonOptions: any = {
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
          label: function (context: {
            dataset: { label: string; yAxisID: string };
            parsed: { y: number | null };
          }) {
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
        tension: 0.3, // Courbes plus douces pour les graphiques en ligne
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
          font: { size: 10 },
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
          font: { size: 11 },
          color: "#94a3b8",
          padding: 8,
        },
      },
    },
  };

  // Données du graphique des inscriptions
  const registrationsData = {
    labels: stats.registrationsPerDay.map((d: any) =>
      new Date(d.date).toLocaleDateString("fr-FR", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Inscriptions",
        data: stats.registrationsPerDay.map((d: any) => d.count),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgba(37, 99, 235, 1)",
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 12,
      },
    ],
  };

  // Données du graphique des paiements
  const paymentsData = {
    labels: stats.paymentsPerDay.map((d: any) =>
      new Date(d.date).toLocaleDateString("fr-FR", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Paiements",
        data: stats.paymentsPerDay.map((d: any) => d.count),
        backgroundColor: "rgba(34, 197, 94, 0.7)",
        borderColor: "rgba(22, 163, 74, 1)",
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 12,
      },
    ],
  };

  // Données du graphique des revenus
  const revenueData = {
    labels: stats.paymentAmountPerDay.map((d: any) =>
      new Date(d.date).toLocaleDateString("fr-FR", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Revenus",
        data: stats.paymentAmountPerDay.map((paymentDay: any, index) => {
          const billDay: any = stats.billsAmountPerDay[index] || {
            totalAmount: 0,
          };
          return paymentDay.totalAmount - billDay.totalAmount;
        }),
        backgroundColor: "rgba(245, 158, 11, 0.7)",
        borderColor: "rgba(217, 119, 6, 1)",
        borderWidth: 2,
        yAxisID: "amount",
        borderRadius: 4,
        barThickness: 12,
      },
    ],
  };

  // Données du graphique des abonnements
  const subscriptionsData = {
    labels: stats.activeSubscriptionsPerDay.map((d: any) =>
      new Date(d.date).toLocaleDateString("fr-FR", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Abonnements actifs",
        data: stats.activeSubscriptionsPerDay.map((d: any) => d.count),
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

  // Données du graphique des factures
  const billsData = {
    labels: stats.billsAmountPerDay.map((d: any) =>
      new Date(d.date).toLocaleDateString("fr-FR", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Montant des factures",
        data: stats.billsAmountPerDay.map((d: any) => d.totalAmount),
        backgroundColor: "rgba(239, 68, 68, 0.7)",
        borderColor: "rgba(220, 38, 38, 1)",
        borderWidth: 2,
        yAxisID: "amount",
        borderRadius: 4,
        barThickness: 12,
      },
    ],
  };

  // Fonction pour exporter les données en CSV
  const exportToCSV = () => {
    const headers = [
      "Date",
      "Inscriptions",
      "Paiements",
      "Montant des paiements",
      "Montant des factures",
      "Abonnements actifs",
    ];
    const rows = stats.registrationsPerDay.map((reg: any, index) => {
      const payment: any = stats.paymentsPerDay[index] || {
        count: 0,
        totalAmount: 0,
      };
      const paymentAmount: any = stats.paymentAmountPerDay[index] || {
        totalAmount: 0,
      };
      const billAmount: any = stats.billsAmountPerDay[index] || {
        totalAmount: 0,
      };
      const subscription: any = stats.activeSubscriptionsPerDay[index] || {
        count: 0,
      };
      return [
        new Date(reg.date).toLocaleDateString("fr-FR"),
        reg.count,
        payment.count,
        paymentAmount.totalAmount,
        billAmount.totalAmount,
        subscription.count,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute(
      "download",
      `stats_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.setAttribute("href", url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fonction pour exporter les données et graphiques en PDF
  const exportToPDF = async () => {
    try {
      // Create a new jsPDF instance in landscape mode
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Add title and export date
      doc.setFontSize(18);
      doc.text("Rapport Statistique", 14, 20);
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

      // Prepare data for the table (optimized columns)
      const headers = [
        "Date",
        "Inscriptions",
        "Paiements",
        "Montant Paiements",
        "Montant Factures",
        "Revenu Net",
        "Abonnements",
      ];

      const rows = stats.registrationsPerDay.map((reg: any, index) => {
        const payment: any = stats.paymentsPerDay[index] || {
          count: 0,
          totalAmount: 0,
        };
        const paymentAmount: any = stats.paymentAmountPerDay[index] || {
          totalAmount: 0,
        };
        const billAmount: any = stats.billsAmountPerDay[index] || {
          totalAmount: 0,
        };
        const subscription: any = stats.activeSubscriptionsPerDay[index] || {
          count: 0,
        };
        const revenue = paymentAmount.totalAmount - billAmount.totalAmount;

        return [
          new Date(reg.date).toLocaleDateString("fr-FR"),
          reg.count,
          payment.count,
          formatCurrency(paymentAmount.totalAmount),
          formatCurrency(billAmount.totalAmount),
          formatCurrency(revenue),
          subscription.count,
        ];
      });

      // Add the table with optimized layout
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 35,
        theme: "grid",
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: "linebreak",
          minCellHeight: 5,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 18 }, // Date
          1: { cellWidth: 15 }, // Inscriptions
          2: { cellWidth: 15 }, // Paiements
          3: { cellWidth: 20 }, // Montant Paiements
          4: { cellWidth: 20 }, // Montant Factures
          5: { cellWidth: 20 }, // Revenu Net
          6: { cellWidth: 15 }, // Abonnements
        },
        margin: { left: 10, right: 10 },
        tableWidth: "auto",
        pageBreak: "auto",
      });

      // Add charts as images with labels
      const charts = document.querySelectorAll("canvas");
      let yPosition = (doc as any).lastAutoTable.finalY + 10;
      const chartLabels = [
        "Graphique des Inscriptions",
        "Graphique des Paiements",
        "Graphique des Revenus",
        "Graphique des Factures",
        "Graphique des Abonnements",
      ];

      for (let i = 0; i < charts.length; i++) {
        const chartCanvas = charts[i] as HTMLCanvasElement;
        const chartImage = chartCanvas.toDataURL("image/png");
        const imgProps = doc.getImageProperties(chartImage);
        const imgWidth = 120;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        // Add new page if needed
        if (yPosition + imgHeight + 10 > 190) {
          doc.addPage("a4", "landscape");
          yPosition = 20;
        }

        // Add label above the chart
        doc.setFontSize(12);
        doc.text(chartLabels[i], 10, yPosition);
        yPosition += 10; // Space for the label

        // Add the chart image
        doc.addImage(chartImage, "PNG", 10, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10; // Space between charts
      }

      // Save the PDF
      doc.save(`stats_export_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center p-6 sm:p-8 bg-white rounded-xl shadow-lg">
          <Loader2 className="h-10 sm:h-12 w-10 sm:w-12 text-blue-500 animate-spin mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
            Chargement des statistiques
          </h3>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Veuillez patienter pendant que nous récupérons vos données...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="p-6 sm:p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
          <div className="flex items-center gap-2 sm:gap-3 text-red-500 mb-4">
            <AlertCircle className="h-6 sm:h-8 w-6 sm:w-8" />
            <h2 className="text-base sm:text-xl font-bold">
              Échec du chargement des statistiques
            </h2>
          </div>
          <p className="text-gray-700 mb-6 text-sm sm:text-base">{error}</p>
          <button
            onClick={fetchData}
            className="w-full py-2 sm:py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
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
                <BarChart className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600" />
                Tableau de bord statistique
              </h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                Perspectives sur la performance de l&apos;entreprise et
                l&apos;engagement des utilisateurs
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex items-center gap-2 text-sm sm:text-base"
                >
                  <Filter className="h-4 w-4" />
                  Filtres
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showFilters && (
                  <div className="absolute right-0 mt-1 sm:mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg py-1 sm:py-2 z-10 border border-gray-100">
                    <button
                      onClick={() => {
                        setTimeRange("week");
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 sm:px-4 py-1.5 hover:bg-gray-50 ${
                        timeRange === "week"
                          ? "text-blue-600 font-medium"
                          : "text-gray-700"
                      } text-xs sm:text-sm`}
                    >
                      Derniers 7 jours
                    </button>
                    <button
                      onClick={() => {
                        setTimeRange("month");
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 sm:px-4 py-1.5 hover:bg-gray-50 ${
                        timeRange === "month"
                          ? "text-blue-600 font-medium"
                          : "text-gray-700"
                      } text-xs sm:text-sm`}
                    >
                      Derniers 30 jours
                    </button>
                    <button
                      onClick={() => {
                        setTimeRange("year");
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 sm:px-4 py-1.5 hover:bg-gray-50 ${
                        timeRange === "year"
                          ? "text-blue-600 font-medium"
                          : "text-gray-700"
                      } text-xs sm:text-sm`}
                    >
                      Derniers 12 mois
                    </button>
                    <button
                      onClick={() => {
                        setTimeRange("all");
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 sm:px-4 py-1.5 hover:bg-gray-50 ${
                        timeRange === "all"
                          ? "text-blue-600 font-medium"
                          : "text-gray-700"
                      } text-xs sm:text-sm`}
                    >
                      Tout le temps
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
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Download className="h-4 w-4" />
                    Exporter en CSV
                  </button>

                  <button
                    onClick={() => {
                      exportToPDF();
                    }}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Download className="h-4 w-4" />
                    Exporter en PDF
                  </button>
                </>
              )}

              <button
                onClick={fetchData}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm sm:text-base"
              >
                <RefreshCw className="h-4 w-4" />
                Rafraîchir
              </button>
            </div>
          </div>
        </div>

        {/* Cartes de métriques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Carte des inscriptions */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                  Total des inscriptions
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatNumber(getTotalRegistrations())}
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
                <User className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              {calculateTrend(stats.registrationsPerDay) > 0 ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 sm:px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-1" />+
                  {calculateTrend(stats.registrationsPerDay).toFixed(1)}%
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 sm:px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-1 transform rotate-180" />
                  {calculateTrend(stats.registrationsPerDay).toFixed(1)}%
                </span>
              )}
              <span className="text-xs text-gray-500 ml-1 sm:ml-2">
                vs période précédente
              </span>
            </div>
          </div>

          {/* Carte des paiements */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                  Total des paiements
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {getTotalPaymentAmount()}
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-green-50 rounded-lg">
                <DollarSign className="h-5 sm:h-6 w-5 sm:w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              {calculateTrend(stats.paymentsPerDay) > 0 ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 sm:px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-1" />+
                  {calculateTrend(stats.paymentsPerDay).toFixed(1)}%
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 sm:px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-1 transform rotate-180" />
                  {calculateTrend(stats.paymentsPerDay).toFixed(1)}%
                </span>
              )}
              <span className="text-xs text-gray-500 ml-1 sm:ml-2">
                vs période précédente
              </span>
            </div>
          </div>

          {/* Carte des revenus totaux */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                  Revenu total
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(getTotalRevenue())}
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-amber-50 rounded-lg">
                <DollarSign className="h-5 sm:h-6 w-5 sm:w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              {calculateTrend(stats.paymentAmountPerDay, "totalAmount") > 0 ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 sm:px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-1" />+
                  {calculateTrend(
                    stats.paymentAmountPerDay,
                    "totalAmount"
                  ).toFixed(1)}
                  %
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 sm:px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-1 transform rotate-180" />
                  {calculateTrend(
                    stats.paymentAmountPerDay,
                    "totalAmount"
                  ).toFixed(1)}
                  %
                </span>
              )}
              <span className="text-xs text-gray-500 ml-1 sm:ml-2">
                vs période précédente
              </span>
            </div>
          </div>

          {/* Carte des abonnements actifs */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                  Abonnements actifs
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatNumber(getActiveSubscriptionsTrend())}
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-purple-50 rounded-lg">
                <Calendar className="h-5 sm:h-6 w-5 sm:w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              {calculateTrend(stats.activeSubscriptionsPerDay) > 0 ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 sm:px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-1" />+
                  {calculateTrend(stats.activeSubscriptionsPerDay).toFixed(1)}%
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 sm:px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-1 transform rotate-180" />
                  {calculateTrend(stats.activeSubscriptionsPerDay).toFixed(1)}%
                </span>
              )}
              <span className="text-xs text-gray-500 ml-1 sm:ml-2">
                vs période précédente
              </span>
            </div>
          </div>

          {/* Carte du montant total des factures */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                  Montant total des factures
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(getTotalBillsAmount())}
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-red-50 rounded-lg">
                <DollarSign className="h-5 sm:h-6 w-5 sm:w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              {calculateTrend(stats.billsAmountPerDay, "totalAmount") > 0 ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 sm:px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-1" />+
                  {calculateTrend(
                    stats.billsAmountPerDay,
                    "totalAmount"
                  ).toFixed(1)}
                  %
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 sm:px-2 py-1 rounded-full flex items-center">
                  <TrendingUp className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-1 transform rotate-180" />
                  {calculateTrend(
                    stats.billsAmountPerDay,
                    "totalAmount"
                  ).toFixed(1)}
                  %
                </span>
              )}
              <span className="text-xs text-gray-500 ml-1 sm:ml-2">
                vs période précédente
              </span>
            </div>
          </div>

          {/* Carte de la valeur moyenne des transactions */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                  Valeur moyenne des transactions
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(getAverageTransactionValue())}
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-teal-50 rounded-lg">
                <DollarSign className="h-5 sm:h-6 w-5 sm:w-6 text-teal-600" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center">
              <span className="text-xs text-gray-500">
                Calculé comme Paiements totaux / Nombre de paiements
              </span>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Graphique des inscriptions */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Inscriptions des utilisateurs
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Nouveaux utilisateurs au fil du temps
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
                <User className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600" />
              </div>
            </div>
            <div className="h-48 sm:h-64">
              <Bar data={registrationsData} options={commonOptions} />
            </div>
          </div>

          {/* Graphique des paiements */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Transactions de paiement
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Nombre de paiements traités
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg">
                <DollarSign className="h-4 sm:h-5 w-4 sm:w-5 text-green-600" />
              </div>
            </div>
            <div className="h-48 sm:h-64">
              <Bar data={paymentsData} options={commonOptions} />
            </div>
          </div>

          {/* Graphique des revenus */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Revenu net
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Revenu total après factures par jour
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-amber-50 rounded-lg">
                <DollarSign className="h-4 sm:h-5 w-4 sm:w-5 text-amber-600" />
              </div>
            </div>
            <div className="h-48 sm:h-64">
              <Bar
                data={revenueData}
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

          {/* Graphique des factures */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Montant des factures
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Dépenses totales des factures par jour
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-red-50 rounded-lg">
                <DollarSign className="h-4 sm:h-5 w-4 sm:w-5 text-red-600" />
              </div>
            </div>
            <div className="h-48 sm:h-64">
              <Bar
                data={billsData}
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

          {/* Graphique des abonnements */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Abonnements actifs
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Croissance des abonnements au fil du temps
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg">
                <Calendar className="h-4 sm:h-5 w-4 sm:w-5 text-purple-600" />
              </div>
            </div>
            <div className="h-48 sm:h-64">
              <Line data={subscriptionsData} options={commonOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
