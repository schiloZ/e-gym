"use client";

import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Plus,
  Trash2,
  DollarSign,
  FileText,
  TrendingUp,
  Download,
  RefreshCw,
  Calendar,
  Tag,
  AlertTriangle,
  X,
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
import toast from "react-hot-toast";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type Bill = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
};

const CATEGORY_COLORS: { [k: string]: string } = {
  "Services publics": "bg-blue-100 text-blue-700",
  Loyer: "bg-purple-100 text-purple-700",
  Courses: "bg-green-100 text-green-700",
  Divertissement: "bg-pink-100 text-pink-700",
  Transport: "bg-orange-100 text-orange-700",
  Santé: "bg-red-100 text-red-700",
  Éducation: "bg-indigo-100 text-indigo-700",
  Autre: "bg-gray-100 text-gray-600",
};

const CHART_COLORS = [
  "rgba(59,130,246,0.8)",
  "rgba(168,85,247,0.8)",
  "rgba(16,185,129,0.8)",
  "rgba(244,114,182,0.8)",
  "rgba(249,115,22,0.8)",
  "rgba(239,68,68,0.8)",
  "rgba(99,102,241,0.8)",
  "rgba(107,114,128,0.8)",
];

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [newBill, setNewBill] = useState<Omit<Bill, "id">>({
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    category: "Services publics",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<{
    subscriptionType: string | null;
  } | null>(null);

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
    fetch("/api/company/me")
      .then((r) => r.json())
      .then((d) => setCompanyInfo(d))
      .catch((e) => toast.error(e.message));
  }, []);

  const isStandardPlan = companyInfo?.subscriptionType !== "free";

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bills");
      if (!res.ok) throw new Error("Échec de la récupération des factures");
      const data = await res.json();
      setBills(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addBill = async () => {
    if (!newBill.description || newBill.amount <= 0) {
      toast.error("Une description et un montant valide sont requis");
      return;
    }
    setSubmitting(true);
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
      toast.success("Facture ajoutée avec succès");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBill = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Échec de la suppression");
      setBills(bills.filter((b) => b.id !== id));
      toast.success("Facture supprimée");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setConfirmDeleteId(null);
    }
  };

  const totalAmount = bills.reduce((s, b) => s + b.amount, 0);
  const avgAmount = bills.length > 0 ? totalAmount / bills.length : 0;
  const topCategory = categories.reduce(
    (top, cat) => {
      const sum = bills
        .filter((b) => b.category === cat)
        .reduce((s, b) => s + b.amount, 0);
      return sum > top.sum ? { cat, sum } : top;
    },
    { cat: "—", sum: 0 }
  );

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(v);

  // ── Chart ──────────────────────────────────────────────────────────────────

  const chartCategories = categories.filter(
    (c) => bills.filter((b) => b.category === c).reduce((s, b) => s + b.amount, 0) > 0
  );
  const chartData = {
    labels: chartCategories,
    datasets: [
      {
        label: "Dépenses",
        data: chartCategories.map((c) =>
          bills.filter((b) => b.category === c).reduce((s, b) => s + b.amount, 0)
        ),
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return CHART_COLORS[context.dataIndex % CHART_COLORS.length];
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          const color = CHART_COLORS[context.dataIndex % CHART_COLORS.length];
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, color.replace("0.8", "0.3"));
          return gradient;
        },
        borderColor: "transparent",
        borderWidth: 0,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.92)",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => ` ${formatCurrency(ctx.raw)}`,
        },
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
        ticks: {
          font: { size: 11 },
          color: "#94a3b8",
          padding: 8,
          callback: (v: any) => formatCurrency(v),
        },
      },
    },
  };

  // ── Exports ────────────────────────────────────────────────────────────────

  const exportToCSV = () => {
    const rows = bills.map((b) => [
      b.description,
      b.amount,
      new Date(b.date).toLocaleDateString("fr-FR"),
      b.category,
    ]);
    const csv = [["Description", "Montant (FCFA)", "Date", "Catégorie"], ...rows]
      .map((r) => r.join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `factures_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      doc.setFontSize(18);
      doc.text("Rapport des Factures", 14, 20);
      doc.setFontSize(11);
      doc.text(
        `Exporté le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
        14, 28
      );
      autoTable(doc, {
        head: [["Description", "Montant", "Date", "Catégorie"]],
        body: bills.map((b) => [
          b.description,
          formatCurrency(b.amount),
          new Date(b.date).toLocaleDateString("fr-FR"),
          b.category,
        ]),
        startY: 35,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: "bold" },
        margin: { left: 14, right: 14 },
      });
      doc.save(`factures_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) {
      alert("Erreur lors de la génération du PDF.");
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading && bills.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-md">
          <RefreshCw className="h-10 w-10 text-red-400 animate-spin" />
          <p className="text-gray-600 font-medium">Chargement des factures…</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-red-500 to-orange-500 p-5 sm:p-6 rounded-2xl text-white shadow-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7" />
            Gestion des factures
          </h1>
          <p className="text-red-100 text-sm mt-0.5">
            Suivi et gestion de vos dépenses
          </p>
        </div>
        {isStandardPlan && (
          <div className="flex gap-2">
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
          </div>
        )}
      </div>

      {/* Cartes de stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500 font-medium">Total factures</p>
            <div className="bg-blue-50 p-2 rounded-xl group-hover:bg-blue-500 transition">
              <FileText className="h-4 w-4 text-blue-500 group-hover:text-white transition" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{bills.length}</p>
          <p className="text-xs text-gray-400 mt-1">dépenses enregistrées</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500 font-medium">Montant total</p>
            <div className="bg-red-50 p-2 rounded-xl group-hover:bg-red-500 transition">
              <DollarSign className="h-4 w-4 text-red-500 group-hover:text-white transition" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-800 leading-tight">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-xs text-gray-400 mt-1">toutes dépenses confondues</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500 font-medium">Catégorie principale</p>
            <div className="bg-orange-50 p-2 rounded-xl group-hover:bg-orange-500 transition">
              <TrendingUp className="h-4 w-4 text-orange-500 group-hover:text-white transition" />
            </div>
          </div>
          <p className="text-base font-bold text-gray-800">{topCategory.cat}</p>
          <p className="text-xs text-gray-400 mt-1">
            {topCategory.sum > 0 ? formatCurrency(topCategory.sum) : "Aucune dépense"}
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Formulaire d'ajout */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-5 py-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle facture
            </h2>
            <p className="text-red-100 text-xs mt-0.5">Enregistrer une dépense</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Description
              </label>
              <input
                type="text"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 transition text-sm"
                value={newBill.description}
                onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                placeholder="Ex : Facture d'électricité"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Montant (FCFA)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">XOF</span>
                <input
                  type="number"
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 transition text-sm"
                  value={newBill.amount || ""}
                  onChange={(e) => setNewBill({ ...newBill, amount: Number(e.target.value) })}
                  placeholder="10 000"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 transition text-sm"
                  value={newBill.date}
                  onChange={(e) => setNewBill({ ...newBill, date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Catégorie
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 transition text-sm appearance-none bg-white"
                  value={newBill.category}
                  onChange={(e) => setNewBill({ ...newBill, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={addBill}
              disabled={submitting}
              className={`w-full py-2.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition text-sm shadow-sm ${
                submitting
                  ? "bg-red-300 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              <Plus className="h-4 w-4" />
              {submitting ? "Ajout en cours…" : "Ajouter la facture"}
            </button>
          </div>
        </div>

        {/* Liste + graphique */}
        <div className="lg:col-span-2 space-y-5">

          {/* Liste des factures */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-red-400" />
                Factures récentes
              </h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {bills.length} entrée{bills.length !== 1 ? "s" : ""}
              </span>
            </div>

            {bills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-gray-300">
                <FileText className="h-10 w-10 mb-3" />
                <p className="text-sm font-medium">Aucune facture enregistrée</p>
                <p className="text-xs mt-1">Ajoutez votre première dépense</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                        <DollarSign className="h-4 w-4 text-red-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {bill.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              CATEGORY_COLORS[bill.category] || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {bill.category}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(bill.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-sm font-bold text-gray-800">
                        {formatCurrency(bill.amount)}
                      </span>

                      {confirmDeleteId === bill.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteBill(bill.id)}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition font-medium"
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-gray-400 hover:text-gray-600 transition p-1"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(bill.id)}
                          className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Total
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Graphique par catégorie */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-orange-500" />
                  Dépenses par catégorie
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Répartition des coûts</p>
              </div>
              {avgAmount > 0 && (
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{formatCurrency(avgAmount)}</p>
                  <p className="text-xs text-gray-400">moyenne/facture</p>
                </div>
              )}
            </div>
            <div className="p-5">
              {chartCategories.length > 0 ? (
                <div className="h-52 sm:h-60">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-gray-300">
                  <AlertTriangle className="h-8 w-8 mb-2" />
                  <p className="text-sm">Aucune donnée à afficher</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
