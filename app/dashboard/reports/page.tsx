"use client";

import { useState, useEffect } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AlertCircle,
  Loader2,
  BarChart2,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  CreditCard,
  Wallet,
  Receipt,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
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
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// ─── Helpers ────────────────────────────────────────────────────────────────

function groupByMonth(
  data: { date: string; count?: number; totalAmount?: number }[],
  valueKey: "count" | "totalAmount",
) {
  const grouped: { [key: string]: number } = {};
  data.forEach((d) => {
    const key = d.date.slice(0, 7);
    grouped[key] = (grouped[key] || 0) + (d[valueKey] || 0);
  });
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));
}

function formatMonth(m: string) {
  const [y, mo] = m.split("-");
  return new Date(parseInt(y), parseInt(mo) - 1, 1).toLocaleDateString(
    "fr-FR",
    { month: "short", year: "numeric" },
  );
}

const METHOD_FR: { [k: string]: string } = {
  Cash: "Espèces",
  "Mobile Money": "Paiement mobile",
  "Credit Card": "Carte de crédit",
  "Bank Transfer": "Virement bancaire",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [stats, setStats] = useState({
    registrationsPerDay: [] as any[],
    paymentsPerDay: [] as any[],
    paymentAmountPerDay: [] as any[],
    billsAmountPerDay: [] as any[],
    activeSubscriptionsPerDay: [] as any[],
  });
  const [methodCounts, setMethodCounts] = useState<{ [k: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("all");
  const [companyInfo, setCompanyInfo] = useState<{
    subscriptionType: string | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/company/me")
      .then((r) => r.json())
      .then((d) => setCompanyInfo(d))
      .catch((e) => toast.error(e.message));
  }, []);

  const isStandardPlan = companyInfo?.subscriptionType !== "free";

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        registrations,
        payments,
        amounts,
        bills,
        subscriptions,
        allPayments,
      ] = await Promise.all([
        fetch("/api/stats/registrations-per-day").then((r) => r.json()),
        fetch("/api/stats/payments-per-day").then((r) => r.json()),
        fetch("/api/stats/payment-amount-per-day").then((r) => r.json()),
        fetch("/api/stats/bills-amount-per-day").then((r) => r.json()),
        fetch("/api/stats/active-subscriptions-per-day").then((r) => r.json()),
        fetch("/api/payments").then((r) => r.json()),
      ]);

      setStats({
        registrationsPerDay: registrations,
        paymentsPerDay: payments,
        paymentAmountPerDay: amounts,
        billsAmountPerDay: bills,
        activeSubscriptionsPerDay: subscriptions,
      });

      // Moyens de paiement
      const counts: { [k: string]: number } = {};
      (Array.isArray(allPayments) ? allPayments : []).forEach(
        (p: { method: string }) => {
          const m = p.method || "Autre";
          counts[m] = (counts[m] || 0) + 1;
        },
      );
      setMethodCounts(counts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Métriques ──────────────────────────────────────────────────────────────

  const totalRegistrations = stats.registrationsPerDay.reduce(
    (s, d) => s + d.count,
    0,
  );
  const totalPaymentAmount = stats.paymentAmountPerDay.reduce(
    (s, d) => s + d.totalAmount,
    0,
  );
  const totalBillsAmount = stats.billsAmountPerDay.reduce(
    (s, d) => s + d.totalAmount,
    0,
  );
  const netRevenue = totalPaymentAmount - totalBillsAmount;
  const avgTransaction =
    stats.paymentsPerDay.length > 0
      ? totalPaymentAmount / stats.paymentsPerDay.length
      : 0;
  const activeSubscriptions = (() => {
    const subs = stats.activeSubscriptionsPerDay;
    if (!subs.length) return 0;
    return subs.reduce((latest: any, cur: any) =>
      new Date(latest.date) > new Date(cur.date) ? latest : cur,
    ).count;
  })();

  const calculateTrend = (data: any[], key = "count") => {
    if (!data || data.length < 2) return 0;
    const cur = data[data.length - 1][key] || 0;
    const prev = data[data.length - 2][key] || 0;
    if (prev === 0) return 100;
    return ((cur - prev) / prev) * 100;
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(v);

  // ── Données graphiques par mois ────────────────────────────────────────────

  const regByMonth = groupByMonth(stats.registrationsPerDay, "count");
  const revByMonth = groupByMonth(stats.paymentAmountPerDay, "totalAmount");

  const regMaxValue =
    regByMonth.length > 0 ? Math.max(...regByMonth.map((d) => d.value)) : 0;
  const totalRegInscriptions = regByMonth.reduce((s, d) => s + d.value, 0);
  const bestRegMonth =
    regByMonth.length > 0
      ? regByMonth.reduce((best, d) => (d.value > best.value ? d : best))
      : null;
  const avgRegPerMonth =
    regByMonth.length > 0
      ? Math.round(totalRegInscriptions / regByMonth.length)
      : 0;

  const registrationsByMonthData = {
    labels: regByMonth.map((d) => formatMonth(d.month)),
    datasets: [
      {
        label: "Inscriptions",
        data: regByMonth.map((d) => d.value),
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(96,165,250,0.85)";
          const isMax = context.parsed?.y === regMaxValue && regMaxValue > 0;
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          if (isMax) {
            gradient.addColorStop(0, "rgba(37,99,235,1)");
            gradient.addColorStop(1, "rgba(37,99,235,0.4)");
          } else {
            gradient.addColorStop(0, "rgba(96,165,250,0.85)");
            gradient.addColorStop(1, "rgba(147,197,253,0.3)");
          }
          return gradient;
        },
        borderColor: (context: any) =>
          context.parsed?.y === regMaxValue && regMaxValue > 0
            ? "rgba(30,64,175,1)"
            : "rgba(59,130,246,0)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const revenueByMonthData = {
    labels: revByMonth.map((d) => formatMonth(d.month)),
    datasets: [
      {
        label: "Revenus (FCFA)",
        data: revByMonth.map((d) => d.value),
        backgroundColor: "rgba(16,185,129,0.12)",
        borderColor: "rgba(5,150,105,1)",
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgba(5,150,105,1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  };

  const methodKeys = Object.keys(methodCounts);
  const doughnutData = {
    labels: methodKeys.map((k) => METHOD_FR[k] || k),
    datasets: [
      {
        data: methodKeys.map((k) => methodCounts[k]),
        backgroundColor: [
          "rgba(16,185,129,0.85)",
          "rgba(249,115,22,0.85)",
          "rgba(59,130,246,0.85)",
          "rgba(168,85,247,0.85)",
        ],
        borderColor: "#fff",
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  // ── Données graphiques détaillés (par jour) ────────────────────────────────

  const dailyLabel = (d: any) =>
    new Date(d.date).toLocaleDateString("fr-FR", {
      month: "short",
      day: "numeric",
    });

  const registrationsData = {
    labels: stats.registrationsPerDay.map(dailyLabel),
    datasets: [
      {
        label: "Inscriptions",
        data: stats.registrationsPerDay.map((d) => d.count),
        backgroundColor: "rgba(59,130,246,0.7)",
        borderColor: "rgba(37,99,235,1)",
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 12,
      },
    ],
  };

  const revenueData = {
    labels: stats.paymentAmountPerDay.map(dailyLabel),
    datasets: [
      {
        label: "Revenu net",
        data: stats.paymentAmountPerDay.map((d: any, i: number) => {
          const bill = stats.billsAmountPerDay[i] || { totalAmount: 0 };
          return d.totalAmount - bill.totalAmount;
        }),
        backgroundColor: "rgba(245,158,11,0.7)",
        borderColor: "rgba(217,119,6,1)",
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 12,
      },
    ],
  };

  const billsData = {
    labels: stats.billsAmountPerDay.map(dailyLabel),
    datasets: [
      {
        label: "Factures",
        data: stats.billsAmountPerDay.map((d: any) => d.totalAmount),
        backgroundColor: "rgba(239,68,68,0.7)",
        borderColor: "rgba(220,38,38,1)",
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 12,
      },
    ],
  };

  const subscriptionsData = {
    labels: stats.activeSubscriptionsPerDay.map(dailyLabel),
    datasets: [
      {
        label: "Abonnements actifs",
        data: stats.activeSubscriptionsPerDay.map((d: any) => d.count),
        backgroundColor: "rgba(168,85,247,0.15)",
        borderColor: "rgba(126,34,206,1)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgba(126,34,206,1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  // ── Options graphiques ─────────────────────────────────────────────────────

  const baseOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.92)",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 12,
        borderColor: "rgba(148,163,184,0.15)",
        borderWidth: 1,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: "#94a3b8" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(203,213,225,0.15)" },
        ticks: { font: { size: 11 }, color: "#94a3b8", padding: 8 },
      },
    },
  };

  const currencyOptions = {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      tooltip: {
        ...baseOptions.plugins.tooltip,
        callbacks: {
          label: (ctx: any) =>
            ctx.parsed.y != null ? ` ${formatCurrency(ctx.parsed.y)}` : "",
        },
      },
    },
  };

  const registrationsByMonthOptions: any = {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      tooltip: {
        ...baseOptions.plugins.tooltip,
        callbacks: {
          title: (items: any[]) => items[0]?.label || "",
          label: (ctx: any) => {
            const v = ctx.parsed.y;
            return ` ${v} inscription${v > 1 ? "s" : ""}`;
          },
        },
      },
    },
    scales: {
      ...baseOptions.scales,
      y: {
        ...baseOptions.scales.y,
        ticks: { ...baseOptions.scales.y.ticks, precision: 0, stepSize: 1 },
      },
    },
  };

  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          font: { size: 11 },
          color: "#64748b",
          padding: 14,
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.92)",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 12,
        callbacks: {
          label: (ctx: any) =>
            ` ${ctx.parsed} transaction${ctx.parsed > 1 ? "s" : ""}`,
        },
      },
    },
  };

  // ── Export CSV ─────────────────────────────────────────────────────────────

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Inscriptions",
      "Paiements",
      "Montant paiements",
      "Montant factures",
      "Abonnements actifs",
    ];
    const rows = stats.registrationsPerDay.map((reg: any, i: number) => {
      const amt: any = stats.paymentAmountPerDay[i] || { totalAmount: 0 };
      const bill: any = stats.billsAmountPerDay[i] || { totalAmount: 0 };
      const sub: any = stats.activeSubscriptionsPerDay[i] || { count: 0 };
      const pay: any = stats.paymentsPerDay[i] || { count: 0 };
      return [
        new Date(reg.date).toLocaleDateString("fr-FR"),
        reg.count,
        pay.count,
        amt.totalAmount,
        bill.totalAmount,
        sub.count,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `stats_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Export PDF ─────────────────────────────────────────────────────────────

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      doc.setFontSize(18);
      doc.text("Rapport Statistique", 14, 20);
      doc.setFontSize(11);
      doc.text(
        `Exporté le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
        14,
        28,
      );
      const headers = [
        "Date",
        "Inscriptions",
        "Paiements",
        "Montant Paiements",
        "Montant Factures",
        "Revenu Net",
        "Abonnements",
      ];
      const rows = stats.registrationsPerDay.map((reg: any, i: number) => {
        const amt: any = stats.paymentAmountPerDay[i] || { totalAmount: 0 };
        const bill: any = stats.billsAmountPerDay[i] || { totalAmount: 0 };
        const sub: any = stats.activeSubscriptionsPerDay[i] || { count: 0 };
        const pay: any = stats.paymentsPerDay[i] || { count: 0 };
        return [
          new Date(reg.date).toLocaleDateString("fr-FR"),
          reg.count,
          pay.count,
          formatCurrency(amt.totalAmount),
          formatCurrency(bill.totalAmount),
          formatCurrency(amt.totalAmount - bill.totalAmount),
          sub.count,
        ];
      });
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 35,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontStyle: "bold",
        },
        margin: { left: 10, right: 10 },
      });
      const charts = document.querySelectorAll("canvas");
      let y = (doc as any).lastAutoTable.finalY + 10;
      const labels = [
        "Inscriptions/mois",
        "Revenus/mois",
        "Moyens de paiement",
        "Inscriptions/jour",
        "Revenu net/jour",
        "Factures/jour",
        "Abonnements actifs",
      ];
      for (let i = 0; i < charts.length; i++) {
        const img = (charts[i] as HTMLCanvasElement).toDataURL("image/png");
        const props = doc.getImageProperties(img);
        const w = 120,
          h = (props.height * w) / props.width;
        if (y + h + 10 > 190) {
          doc.addPage("a4", "landscape");
          y = 20;
        }
        doc.setFontSize(11);
        doc.text(labels[i] || `Graphique ${i + 1}`, 10, y);
        y += 8;
        doc.addImage(img, "PNG", 10, y, w, h);
        y += h + 10;
      }
      doc.save(`stats_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du PDF.");
    }
  };

  // ── Trend badge ────────────────────────────────────────────────────────────

  const TrendBadge = ({ value }: { value: number }) =>
    value >= 0 ? (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
        <TrendingUp className="h-3 w-3" />+{value.toFixed(1)}%
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
        <TrendingDown className="h-3 w-3" />
        {value.toFixed(1)}%
      </span>
    );

  // ── States ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-md">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <p className="text-gray-600 font-medium">
            Chargement des statistiques…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="p-8 bg-white rounded-2xl shadow-md max-w-sm w-full text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-800 mb-1">
            Erreur de chargement
          </p>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <button
            onClick={fetchData}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  const totalTransactions = Object.values(methodCounts).reduce(
    (a, b) => a + b,
    0,
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-600 to-blue-700 p-5 sm:p-6 rounded-2xl text-white shadow-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart2 className="h-7 w-7" />
            Statistiques
          </h1>
          <p className="text-indigo-200 text-sm mt-0.5">
            Analyse de la performance de votre salle
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Filtre période */}
          <div className="flex bg-white/10 border border-white/20 rounded-xl overflow-hidden text-sm">
            {[
              { key: "week", label: "7j" },
              { key: "month", label: "30j" },
              { key: "year", label: "1 an" },
              { key: "all", label: "Tout" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setTimeRange(f.key)}
                className={`px-3 py-1.5 transition font-medium ${
                  timeRange === f.key
                    ? "bg-white text-blue-700"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {isStandardPlan && (
            <>
              <button
                onClick={exportToCSV}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 transition"
              >
                <Download className="h-4 w-4" /> CSV
              </button>
              <button
                onClick={exportToPDF}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 transition"
              >
                <Download className="h-4 w-4" /> PDF
              </button>
            </>
          )}
          <button
            onClick={fetchData}
            className="bg-white text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 transition font-medium"
          >
            <RefreshCw className="h-4 w-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* Cartes métriques */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            label: "Total inscriptions",
            value: totalRegistrations,
            display: totalRegistrations.toString(),
            icon: <Users className="h-5 w-5 text-blue-500" />,
            bg: "bg-blue-50 group-hover:bg-blue-500",
            iconColor: "text-blue-500 group-hover:text-white",
            trend: calculateTrend(stats.registrationsPerDay),
            sub: "clients enregistrés",
          },
          {
            label: "Revenus totaux",
            value: totalPaymentAmount,
            display: formatCurrency(totalPaymentAmount),
            icon: <DollarSign className="h-5 w-5 text-green-500" />,
            bg: "bg-green-50 group-hover:bg-green-500",
            iconColor: "text-green-500 group-hover:text-white",
            trend: calculateTrend(stats.paymentAmountPerDay, "totalAmount"),
            sub: "entrées d'argent",
          },
          {
            label: "Revenu net",
            value: netRevenue,
            display: formatCurrency(netRevenue),
            icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
            bg: "bg-emerald-50 group-hover:bg-emerald-500",
            iconColor: "text-emerald-500 group-hover:text-white",
            trend: calculateTrend(stats.paymentAmountPerDay, "totalAmount"),
            sub: "après déduction des factures",
          },
          {
            label: "Abonnements actifs",
            value: activeSubscriptions,
            display: activeSubscriptions.toString(),
            icon: <Calendar className="h-5 w-5 text-purple-500" />,
            bg: "bg-purple-50 group-hover:bg-purple-500",
            iconColor: "text-purple-500 group-hover:text-white",
            trend: calculateTrend(stats.activeSubscriptionsPerDay),
            sub: "abonnements en cours",
          },
          {
            label: "Total factures",
            value: totalBillsAmount,
            display: formatCurrency(totalBillsAmount),
            icon: <Receipt className="h-5 w-5 text-red-400" />,
            bg: "bg-red-50 group-hover:bg-red-500",
            iconColor: "text-red-400 group-hover:text-white",
            trend: calculateTrend(stats.billsAmountPerDay, "totalAmount"),
            sub: "dépenses facturées",
          },
          // {
          //   label: "Transaction moyenne",
          //   value: avgTransaction,
          //   display: formatCurrency(avgTransaction),
          //   icon: <Wallet className="h-5 w-5 text-orange-500" />,
          //   bg: "bg-orange-50 group-hover:bg-orange-500",
          //   iconColor: "text-orange-500 group-hover:text-white",
          //   trend: null,
          //   sub: "par transaction",
          // },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                {card.label}
              </p>
              <div className={`p-2 rounded-xl transition ${card.bg}`}>
                <span className={`transition ${card.iconColor}`}>
                  {card.icon}
                </span>
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight mb-2">
              {card.display}
            </p>
            <div className="flex items-center gap-2">
              {card.trend !== null ? <TrendBadge value={card.trend} /> : null}
              <span className="text-xs text-gray-400">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Graphiques par mois ── */}
      <div>
        <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-indigo-500" />
          Analyse mensuelle
        </h2>

        {/* Revenus par mois — pleine largeur */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Revenus nets par mois
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Évolution des entrées d&apos;argent mois par mois
              </p>
            </div>
          </div>
          <div className="h-56 sm:h-64">
            {revByMonth.length > 0 ? (
              <Line data={revenueByMonthData} options={currencyOptions} />
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        {/* Inscriptions + Moyens de paiement */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Inscriptions par mois
                </h3>
                <p className="text-blue-100 text-xs mt-0.5">
                  Nouveaux clients enregistrés chaque mois
                </p>
              </div>
              {totalRegInscriptions > 0 && (
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {totalRegInscriptions} au total
                </span>
              )}
            </div>
            <div className="p-5">
              <div className="h-56 sm:h-60">
                {regByMonth.length > 0 ? (
                  <Bar
                    data={registrationsByMonthData}
                    options={registrationsByMonthOptions}
                  />
                ) : (
                  <EmptyChart />
                )}
              </div>
              {regByMonth.length > 0 && (
                <div className="flex items-center justify-around mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">
                      {totalRegInscriptions}
                    </p>
                    <p className="text-xs text-gray-400">Total</p>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-800">
                      {bestRegMonth ? formatMonth(bestRegMonth.month) : "—"}
                    </p>
                    <p className="text-xs text-gray-400">Meilleur mois</p>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">
                      {avgRegPerMonth}
                    </p>
                    <p className="text-xs text-gray-400">Moy./mois</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-5">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-orange-500" />
                Moyens de paiement
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {totalTransactions} transaction
                {totalTransactions !== 1 ? "s" : ""} au total
              </p>
            </div>
            <div className="h-56 sm:h-64">
              {totalTransactions > 0 ? (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Graphiques détaillés (par jour) ── */}
      <div>
        <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-indigo-500" />
          Analyse détaillée (par jour)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* <ChartCard
            title="Inscriptions par jour"
            subtitle="Nouveaux utilisateurs au fil du temps"
            icon={<Users className="h-4 w-4 text-blue-600" />}
            iconBg="bg-blue-50"
          >
            <Bar data={registrationsData} options={baseOptions} />
          </ChartCard> */}

          <ChartCard
            title="Revenu net par jour"
            subtitle="Revenus après déduction des factures"
            icon={<DollarSign className="h-4 w-4 text-amber-600" />}
            iconBg="bg-amber-50"
          >
            <Bar data={revenueData} options={currencyOptions} />
          </ChartCard>

          <ChartCard
            title="Montant des factures"
            subtitle="Dépenses journalières facturées"
            icon={<Receipt className="h-4 w-4 text-red-500" />}
            iconBg="bg-red-50"
          >
            <Bar data={billsData} options={currencyOptions} />
          </ChartCard>
          {/* 
          <ChartCard
            title="Abonnements actifs"
            subtitle="Évolution des abonnements en cours"
            icon={<Calendar className="h-4 w-4 text-purple-600" />}
            iconBg="bg-purple-50"
          >
            <Line data={subscriptionsData} options={baseOptions} />
          </ChartCard> */}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function EmptyChart() {
  return (
    <div className="h-full flex items-center justify-center text-gray-300 text-sm">
      Aucune donnée disponible
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon,
  iconBg,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <div className={`p-2 rounded-xl ${iconBg}`}>{icon}</div>
      </div>
      <div className="h-48 sm:h-56">{children}</div>
    </div>
  );
}
