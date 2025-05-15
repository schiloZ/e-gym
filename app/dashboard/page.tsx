"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  Calendar,
  DollarSign,
  Search,
  ArrowRight,
  TrendingUp,
  Activity,
  BarChart,
} from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
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

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averagePayment: 0,
  });
  const [recentClients, setRecentClients] = useState([]);
  const [chartData, setChartData] = useState({
    registrationsPerDay: [],
    activeSubscriptionsPerDay: [],
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Récupérer les statistiques, les clients récents et les données des graphiques au montage
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer le total des clients
        const clientsRes = await fetch("/api/clients");
        const clientsData = await clientsRes.json();
        const totalClients = clientsData.length || 0;

        // Récupérer les paiements pour les calculs de revenus
        const paymentsRes = await fetch("/api/payments");
        const paymentsData = await paymentsRes.json();
        const totalRevenue = paymentsData.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );

        // Calculer les revenus mensuels (pour mai 2025)
        const currentMonth = new Date("2025-05-01");
        const monthlyPayments = paymentsData.filter((payment) => {
          const paymentDate = new Date(payment.date);
          return (
            paymentDate.getMonth() === currentMonth.getMonth() &&
            paymentDate.getFullYear() === currentMonth.getFullYear()
          );
        });
        const monthlyRevenue = monthlyPayments.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );

        // Calculer le paiement moyen
        const averagePayment =
          paymentsData.length > 0 ? totalRevenue / paymentsData.length : 0;

        setStats({
          totalClients,
          totalRevenue,
          monthlyRevenue,
          averagePayment: Math.round(averagePayment),
        });

        // Récupérer les clients récents (triés par date d'inscription, limités à 3)
        const recentClients = clientsData
          .sort(
            (a, b) =>
              new Date(b.registrationDate).getTime() -
              new Date(a.registrationDate).getTime()
          )
          .slice(0, 3);
        setRecentClients(recentClients);

        // Récupérer les données des graphiques
        const [registrations, subscriptions] = await Promise.all([
          fetch("/api/stats/registrations-per-day").then((res) => res.json()),
          fetch("/api/stats/active-subscriptions-per-day").then((res) =>
            res.json()
          ),
        ]);
        setChartData({
          registrationsPerDay: registrations,
          activeSubscriptionsPerDay: subscriptions,
        });
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données du tableau de bord :",
          error
        );
      }
    };

    fetchData();
  }, []);

  // Configurations des graphiques
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#1e293b",
        bodyColor: "#334155",
        titleFont: { weight: "bold" },
        bodyFont: { size: 12 },
        padding: 10,
        borderColor: "rgba(203, 213, 225, 0.5)",
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("fr-FR").format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    elements: {
      line: { tension: 0.3 },
      point: { radius: 3, hoverRadius: 5 },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { font: { size: 9 }, color: "#94a3b8" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(203, 213, 225, 0.2)", drawBorder: false },
        ticks: { font: { size: 10 }, color: "#94a3b8", padding: 6 },
      },
    },
  };

  // Données du graphique des inscriptions
  const registrationsData = {
    labels: chartData.registrationsPerDay.map((d) =>
      new Date(d.date).toLocaleDateString("fr-FR", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Inscriptions",
        data: chartData.registrationsPerDay.map((d) => d.count),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgba(37, 99, 235, 1)",
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 10,
      },
    ],
  };

  // Données du graphique des abonnements
  const subscriptionsData = {
    labels: chartData.activeSubscriptionsPerDay.map((d) =>
      new Date(d.date).toLocaleDateString("fr-FR", {
        month: "short",
        day: "numeric",
      })
    ),
    datasets: [
      {
        label: "Abonnements actifs",
        data: chartData.activeSubscriptionsPerDay.map((d) => d.count),
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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 bg-gradient-to-r from-blue-600 to-blue-800 p-4 sm:p-6 rounded-xl text-white shadow-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Tableau de bord E-Gym
          </h1>
          <p className="text-blue-100 text-sm sm:text-base">
            Gérez votre entreprise de fitness facilement
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link
            href="/dashboard/clients/new"
            className="bg-white text-blue-600 hover:bg-blue-50 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg font-medium flex items-center gap-1 sm:gap-2 transition shadow-md text-sm sm:text-base"
          >
            <Users className="h-4 sm:h-5 w-4 sm:w-5" />
            Nouveau client
          </Link>
          <Link
            href="/dashboard/payments/new"
            className="bg-green-500 hover:bg-green-600 text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg font-medium flex items-center gap-1 sm:gap-2 transition shadow-md text-sm sm:text-base"
          >
            <CreditCard className="h-4 sm:h-5 w-4 sm:w-5" />
            Nouveau paiement
          </Link>
        </div>
      </div>

      {/* Disposition en grille Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Cartes de statistiques */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition group">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Clients totaux
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2 mb-1 sm:mb-1 group-hover:text-blue-600 transition">
                {stats.totalClients}
              </p>
              <p className="text-xs font-medium text-gray-400 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                <span className="text-green-500">+0</span> ce mois
              </p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition">
              <Users className="h-5 sm:h-6 w-5 sm:w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition group">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Revenus totaux
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2 mb-1 sm:mb-1 group-hover:text-green-600 transition">
                {stats.totalRevenue.toLocaleString()} FCFA
              </p>
              <p className="text-xs font-medium text-gray-400">Gains totaux</p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-full text-green-500 group-hover:bg-green-500 group-hover:text-white transition">
              <DollarSign className="h-5 sm:h-6 w-5 sm:w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border-l-4 border-purple-500 hover:shadow-lg transition group">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Revenus mensuels
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2 mb-1 sm:mb-1 group-hover:text-purple-600 transition">
                {stats.monthlyRevenue.toLocaleString()} FCFA
              </p>
              <p className="text-xs font-medium text-gray-400 flex items-center">
                <Activity className="h-3 w-3 mr-1 text-purple-500" />
                <span>0 paiements</span> ce mois
              </p>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-full text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition">
              <Calendar className="h-5 sm:h-6 w-5 sm:w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border-l-4 border-orange-500 hover:shadow-lg transition group">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Paiement moyen
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2 mb-1 sm:mb-1 group-hover:text-orange-600 transition">
                {stats.averagePayment.toLocaleString()} FCFA
              </p>
              <p className="text-xs font-medium text-gray-400">
                Par transaction
              </p>
            </div>
            <div className="bg-orange-100 p-2 sm:p-3 rounded-full text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition">
              <CreditCard className="h-5 sm:h-6 w-5 sm:w-6" />
            </div>
          </div>
        </div>

        {/* Clients récents dans la grille Bento */}
        <div className="md:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-md overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                <Users className="h-4 sm:h-5 w-4 sm:w-5 mr-1 sm:mr-2 text-blue-500" />
                Clients récents
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Vos clients récemment inscrits
              </p>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 sm:h-4 w-3 sm:w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-1 sm:py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50 w-full text-sm sm:text-base"
                placeholder="Rechercher des clients..."
              />
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {recentClients.map((client) => (
              <div
                key={client.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 py-2 sm:py-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition border border-gray-100 hover:border-blue-200"
              >
                <div className="mb-2 sm:mb-0">
                  <p className="font-semibold text-gray-800 text-sm sm:text-base">
                    {client.name}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                      <span className="text-blue-500">✉️</span>{" "}
                      {client.email || "N/A"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                      <span className="text-blue-500">📞</span>{" "}
                      {client.phone || "N/A"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <span className="text-blue-500">📅</span> Inscrit(e) le :{" "}
                    {new Date(client.registrationDate).toLocaleDateString(
                      "fr-FR"
                    )}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-medium transition"
                  >
                    Voir les détails
                  </Link>
                </div>
              </div>
            ))}
            {recentClients.length === 0 && (
              <div className="text-gray-500 text-center py-10 sm:py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Users className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-gray-300 mb-2 sm:mb-3" />
                <p className="font-medium text-sm sm:text-base">
                  Aucun client trouvé
                </p>
                <p className="text-xs sm:text-sm mt-1">
                  Ajoutez votre premier client pour commencer
                </p>
              </div>
            )}
          </div>
          {recentClients.length > 0 && (
            <div className="mt-3 sm:mt-4 text-center">
              <Link
                href="/dashboard/clients"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
              >
                Voir tous les clients
                <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4 ml-1" />
              </Link>
            </div>
          )}
        </div>

        {/* Graphiques dans la grille Bento */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border-t-4 border-blue-500">
          <div className="flex justify-between items-center mb-2 sm:mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <Users className="h-4 sm:h-5 w-4 sm:w-5 mr-1 sm:mr-2 text-blue-500" />
                Inscriptions des utilisateurs
              </h2>
              <p className="text-sm text-gray-600">
                Nouveaux utilisateurs dans le temps
              </p>
            </div>
          </div>
          <div className="h-40 sm:h-48 md:h-64">
            <Bar data={registrationsData} options={commonOptions} />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border-t-4 border-purple-500">
          <div className="flex justify-between items-center mb-2 sm:mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <Calendar className="h-4 sm:h-5 w-4 sm:w-5 mr-1 sm:mr-2 text-purple-500" />
                Abonnements actifs
              </h2>
              <p className="text-sm text-gray-600">
                Croissance des abonnements dans le temps
              </p>
            </div>
          </div>
          <div className="h-40 sm:h-48 md:h-64">
            <Line data={subscriptionsData} options={commonOptions} />
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-bold text-gray-800 mb-2 sm:mb-4 flex items-center">
          <Activity className="h-4 sm:h-5 w-4 sm:w-5 mr-1 sm:mr-2 text-purple-500" />
          Analyse commerciale
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <Link
            href="/dashboard/payments"
            className="text-gray-700 hover:text-blue-600 flex items-center justify-between p-2 sm:p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition text-xs sm:text-sm"
          >
            <span className="flex items-center">
              <CreditCard className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2 text-blue-500" />
              Historique des paiements
            </span>
            <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4" />
          </Link>
          <Link
            href="/dashboard/reports"
            className="text-gray-700 hover:text-blue-600 flex items-center justify-between p-2 sm:p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition text-xs sm:text-sm"
          >
            <span className="flex items-center">
              <TrendingUp className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2 text-green-500" />
              Rapports financiers
            </span>
            <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4" />
          </Link>
          <Link
            href="/dashboard/clients"
            className="text-gray-700 hover:text-blue-600 flex items-center justify-between p-2 sm:p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition text-xs sm:text-sm"
          >
            <span className="flex items-center">
              <Users className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2 text-purple-500" />
              Gestion des clients
            </span>
            <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4" />
          </Link>
          <Link
            href="/dashboard/reports"
            className="text-gray-700 hover:text-blue-600 flex items-center justify-between p-2 sm:p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition text-xs sm:text-sm"
          >
            <span className="flex items-center">
              <BarChart className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2 text-purple-500" />
              Voir plus d'analyses
            </span>
            <ArrowRight className="h-3 sm:h-4 w-3 sm:w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
