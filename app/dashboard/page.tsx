"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
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
  Filler
);

function groupByMonth(
  data: { date: string; count?: number; totalAmount?: number }[],
  valueKey: "count" | "totalAmount"
) {
  const grouped: { [key: string]: number } = {};
  data.forEach((d) => {
    const monthKey = d.date.slice(0, 7);
    grouped[monthKey] = (grouped[monthKey] || 0) + (d[valueKey] || 0);
  });
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));
}

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

const METHOD_LABELS: { [key: string]: string } = {
  Cash: "Espèces",
  "Mobile Money": "Paiement mobile",
  "Credit Card": "Carte de crédit",
  "Bank Transfer": "Virement bancaire",
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averagePayment: 0,
  });
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [registrationsPerMonth, setRegistrationsPerMonth] = useState<
    { month: string; value: number }[]
  >([]);
  const [revenuePerMonth, setRevenuePerMonth] = useState<
    { month: string; value: number }[]
  >([]);
  const [methodCounts, setMethodCounts] = useState<{ [key: string]: number }>(
    {}
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, paymentsRes, registrationsRes, revenueRes] =
          await Promise.all([
            fetch("/api/clients"),
            fetch("/api/payments"),
            fetch("/api/stats/registrations-per-day"),
            fetch("/api/stats/payment-amount-per-day"),
          ]);

        const clientsData = await clientsRes.json();
        const paymentsData = await paymentsRes.json();
        const registrationsData = await registrationsRes.json();
        const revenueData = await revenueRes.json();

        // Stats
        const totalClients = clientsData.length || 0;
        const totalRevenue = paymentsData.reduce(
          (sum: number, p: { amount: number }) => sum + p.amount,
          0
        );
        const now = new Date();
        const monthlyRevenue = paymentsData
          .filter((p: { date: string }) => {
            const d = new Date(p.date);
            return (
              d.getMonth() === now.getMonth() &&
              d.getFullYear() === now.getFullYear()
            );
          })
          .reduce(
            (sum: number, p: { amount: number }) => sum + p.amount,
            0
          );
        const averagePayment =
          paymentsData.length > 0
            ? Math.round(totalRevenue / paymentsData.length)
            : 0;

        setStats({ totalClients, totalRevenue, monthlyRevenue, averagePayment });

        // Clients récents
        const sorted = [...clientsData]
          .sort(
            (a, b) =>
              new Date(b.registrationDate).getTime() -
              new Date(a.registrationDate).getTime()
          )
          .slice(0, 4);
        setRecentClients(sorted);

        // Graphiques par mois
        setRegistrationsPerMonth(groupByMonth(registrationsData, "count"));
        setRevenuePerMonth(groupByMonth(revenueData, "totalAmount"));

        // Moyens de paiement
        const counts: { [key: string]: number } = {};
        paymentsData.forEach((p: { method: string }) => {
          const m = p.method || "Autre";
          counts[m] = (counts[m] || 0) + 1;
        });
        setMethodCounts(counts);
      } catch (error) {
        console.error("Erreur dashboard :", error);
      }
    };

    fetchData();
  }, []);

  // Graphique inscriptions par mois
  const regMaxValue =
    registrationsPerMonth.length > 0
      ? Math.max(...registrationsPerMonth.map((d) => d.value))
      : 0;
  const totalRegInscriptions = registrationsPerMonth.reduce(
    (s, d) => s + d.value,
    0
  );
  const bestRegMonth =
    registrationsPerMonth.length > 0
      ? registrationsPerMonth.reduce((best, d) =>
          d.value > best.value ? d : best
        )
      : null;
  const avgRegPerMonth =
    registrationsPerMonth.length > 0
      ? Math.round(totalRegInscriptions / registrationsPerMonth.length)
      : 0;

  const registrationsChartData = {
    labels: registrationsPerMonth.map((d) => formatMonth(d.month)),
    datasets: [
      {
        label: "Inscriptions",
        data: registrationsPerMonth.map((d) => d.value),
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(96,165,250,0.85)";
          const isMax = context.parsed?.y === regMaxValue && regMaxValue > 0;
          const gradient = ctx.createLinearGradient(
            0, chartArea.top, 0, chartArea.bottom
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

  // Graphique revenus par mois
  const revenueChartData = {
    labels: revenuePerMonth.map((d) => formatMonth(d.month)),
    datasets: [
      {
        label: "Revenus (FCFA)",
        data: revenuePerMonth.map((d) => d.value),
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        borderColor: "rgba(5, 150, 105, 1)",
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgba(5, 150, 105, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  };

  // Graphique moyens de paiement (donut)
  const methodKeys = Object.keys(methodCounts);
  const doughnutData = {
    labels: methodKeys.map((k) => METHOD_LABELS[k] || k),
    datasets: [
      {
        data: methodKeys.map((k) => methodCounts[k]),
        backgroundColor: [
          "rgba(16, 185, 129, 0.85)",
          "rgba(249, 115, 22, 0.85)",
          "rgba(59, 130, 246, 0.85)",
          "rgba(168, 85, 247, 0.85)",
        ],
        borderColor: "#fff",
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const baseOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 12,
        borderColor: "rgba(148, 163, 184, 0.2)",
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (ctx: any) =>
            ctx.parsed.y != null
              ? `${new Intl.NumberFormat("fr-FR").format(ctx.parsed.y)}`
              : "",
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
        grid: { color: "rgba(203, 213, 225, 0.15)" },
        ticks: { font: { size: 11 }, color: "#94a3b8", padding: 8 },
      },
    },
  };

  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          font: { size: 11 },
          color: "#64748b",
          padding: 12,
          boxWidth: 12,
          boxHeight: 12,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 12,
        borderColor: "rgba(148, 163, 184, 0.2)",
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => ` ${ctx.parsed} transaction${ctx.parsed > 1 ? "s" : ""}`,
        },
      },
    },
  };

  const registrationsOptions: any = {
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

  const totalTransactions = Object.values(methodCounts).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-600 to-blue-800 p-5 sm:p-6 rounded-2xl text-white shadow-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-blue-200 text-sm mt-0.5">
            Vue d&apos;ensemble de votre salle de sport
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/clients/new"
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-xl font-medium flex items-center gap-2 transition text-sm backdrop-blur-sm"
          >
            <Users className="h-4 w-4" />
            Nouveau client
          </Link>
          <Link
            href="/dashboard/payments/new"
            className="bg-green-500 hover:bg-green-400 text-white py-2 px-4 rounded-xl font-medium flex items-center gap-2 transition text-sm shadow-md"
          >
            <CreditCard className="h-4 w-4" />
            Paiement
          </Link>
        </div>
      </div>

      {/* Cartes de stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Clients totaux</p>
            <div className="bg-blue-50 p-2 rounded-xl group-hover:bg-blue-500 transition">
              <Users className="h-4 w-4 text-blue-500 group-hover:text-white transition" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">
            {stats.totalClients}
          </p>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-400" /> Clients inscrits
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Revenus totaux</p>
            <div className="bg-green-50 p-2 rounded-xl group-hover:bg-green-500 transition">
              <DollarSign className="h-4 w-4 text-green-500 group-hover:text-white transition" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">
            {stats.totalRevenue.toLocaleString()}
            <span className="text-sm font-medium text-gray-400 ml-1">FCFA</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Tous paiements confondus</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Ce mois</p>
            <div className="bg-purple-50 p-2 rounded-xl group-hover:bg-purple-500 transition">
              <Activity className="h-4 w-4 text-purple-500 group-hover:text-white transition" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">
            {stats.monthlyRevenue.toLocaleString()}
            <span className="text-sm font-medium text-gray-400 ml-1">FCFA</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Revenus du mois en cours</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Paiement moyen</p>
            <div className="bg-orange-50 p-2 rounded-xl group-hover:bg-orange-500 transition">
              <Wallet className="h-4 w-4 text-orange-500 group-hover:text-white transition" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">
            {stats.averagePayment.toLocaleString()}
            <span className="text-sm font-medium text-gray-400 ml-1">FCFA</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Par transaction</p>
        </div>
      </div>

      {/* Graphique revenus (pleine largeur) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Revenus nets par mois
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Évolution des entrées d&apos;argent</p>
          </div>
        </div>
        <div className="h-52 sm:h-64">
          {revenuePerMonth.length > 0 ? (
            <Line data={revenueChartData} options={baseOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-300 text-sm">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>

      {/* Inscriptions par mois + Moyens de paiement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Inscriptions */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4" />
                Inscriptions par mois
              </h2>
              <p className="text-blue-100 text-xs mt-0.5">Nouveaux clients enregistrés</p>
            </div>
            {totalRegInscriptions > 0 && (
              <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {totalRegInscriptions} au total
              </span>
            )}
          </div>
          <div className="p-5">
            <div className="h-52 sm:h-60">
              {registrationsPerMonth.length > 0 ? (
                <Bar data={registrationsChartData} options={registrationsOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-300 text-sm">
                  Aucune donnée disponible
                </div>
              )}
            </div>
            {registrationsPerMonth.length > 0 && (
              <div className="flex items-center justify-around mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{totalRegInscriptions}</p>
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
                  <p className="text-lg font-bold text-gray-800">{avgRegPerMonth}</p>
                  <p className="text-xs text-gray-400">Moy./mois</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Moyens de paiement */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" />
              Moyens de paiement
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalTransactions} transaction{totalTransactions !== 1 ? "s" : ""} au total
            </p>
          </div>
          <div className="h-52 sm:h-64">
            {totalTransactions > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 text-sm">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clients récents + Actions rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Clients récents */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Clients récents
            </h2>
            <Link
              href="/dashboard/clients"
              className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              Voir tous <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentClients.length > 0 ? (
              recentClients.map((client: any) => (
                <Link
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 transition border border-transparent hover:border-blue-100 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0 group-hover:bg-blue-500 group-hover:text-white transition">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {client.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {client.phone || client.email || "Aucun contact"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(client.registrationDate).toLocaleDateString(
                        "fr-FR",
                        { day: "numeric", month: "short" }
                      )}
                    </p>
                    <ArrowRight className="h-3 w-3 text-gray-300 group-hover:text-blue-500 transition ml-auto mt-1" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-10 text-gray-300">
                <Users className="h-10 w-10 mx-auto mb-2" />
                <p className="text-sm">Aucun client pour le moment</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            Actions rapides
          </h2>
          <div className="space-y-2">
            {[
              {
                href: "/dashboard/clients/new",
                icon: <Users className="h-4 w-4 text-blue-500" />,
                label: "Nouveau client",
                bg: "hover:bg-blue-50 hover:border-blue-100",
              },
              {
                href: "/dashboard/payments/new",
                icon: <CreditCard className="h-4 w-4 text-green-500" />,
                label: "Enregistrer un paiement",
                bg: "hover:bg-green-50 hover:border-green-100",
              },
              {
                href: "/dashboard/payments",
                icon: <DollarSign className="h-4 w-4 text-orange-500" />,
                label: "Historique des paiements",
                bg: "hover:bg-orange-50 hover:border-orange-100",
              },
              {
                href: "/dashboard/clients",
                icon: <Users className="h-4 w-4 text-purple-500" />,
                label: "Gestion des clients",
                bg: "hover:bg-purple-50 hover:border-purple-100",
              },
              {
                href: "/dashboard/reports",
                icon: <TrendingUp className="h-4 w-4 text-blue-400" />,
                label: "Rapports financiers",
                bg: "hover:bg-blue-50 hover:border-blue-100",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between p-3 rounded-xl border border-transparent transition text-sm text-gray-700 ${item.bg}`}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
