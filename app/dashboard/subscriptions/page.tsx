"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CalendarX2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  UserCircle2,
  CreditCard,
  ChevronRight,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

interface Payment {
  id: string;
  amount: number;
  subscription: string;
  method: string;
  startDate: string;
  endDate: string;
  nextPaymentDate: string;
  paymentStatus: string;
  date: string;
  client: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    imagePath?: string;
  };
}

type FilterType = "expired" | "week" | "month" | "all";

const SUBSCRIPTION_FR: { [k: string]: string } = {
  Monthly: "Mensuel",
  Yearly: "Annuel",
  Weekly: "Hebdomadaire",
  Daily: "Journalier",
  Quarterly: "Trimestriel",
};

function getDaysUntilExpiry(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  end.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ days }: { days: number }) {
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
        <CalendarX2 className="h-3 w-3" />
        Expiré il y a {Math.abs(days)} j
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
        <AlertTriangle className="h-3 w-3" />
        Expire aujourd'hui
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">
        <Clock className="h-3 w-3" />
        Expire dans {days} j
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
        <Clock className="h-3 w-3" />
        Expire dans {days} j
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
      <CheckCircle2 className="h-3 w-3" />
      Actif — {days} j restants
    </span>
  );
}

export default function SubscriptionsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("week");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch("/api/payments");
        if (!res.ok) throw new Error("Erreur de chargement");
        const data: Payment[] = await res.json();
        setPayments(data);
      } catch {
        toast.error("Impossible de charger les abonnements");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  // Keep only the latest payment per client
  const latestPerClient = useMemo(() => {
    const map = new Map<string, Payment>();
    payments.forEach((p) => {
      const existing = map.get(p.client.id);
      if (!existing || new Date(p.endDate) > new Date(existing.endDate)) {
        map.set(p.client.id, p);
      }
    });
    return Array.from(map.values());
  }, [payments]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = latestPerClient;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.client.name.toLowerCase().includes(q));
    }

    switch (filter) {
      case "expired":
        list = list.filter((p) => getDaysUntilExpiry(p.endDate) < 0);
        break;
      case "week":
        list = list.filter((p) => {
          const d = getDaysUntilExpiry(p.endDate);
          return d >= 0 && d <= 7;
        });
        break;
      case "month":
        list = list.filter((p) => {
          const d = getDaysUntilExpiry(p.endDate);
          return d >= 0 && d <= 30;
        });
        break;
      case "all":
      default:
        break;
    }

    // Sort: expired first (most recent), then soonest to expire
    list = [...list].sort((a, b) => {
      const dA = getDaysUntilExpiry(a.endDate);
      const dB = getDaysUntilExpiry(b.endDate);
      return dA - dB;
    });

    return list;
  }, [latestPerClient, filter, search]);

  // Stats
  const expiredCount = latestPerClient.filter(
    (p) => getDaysUntilExpiry(p.endDate) < 0
  ).length;
  const expiresThisWeek = latestPerClient.filter((p) => {
    const d = getDaysUntilExpiry(p.endDate);
    return d >= 0 && d <= 7;
  }).length;
  const expiresThisMonth = latestPerClient.filter((p) => {
    const d = getDaysUntilExpiry(p.endDate);
    return d >= 0 && d <= 30;
  }).length;

  const filters: { key: FilterType; label: string; count: number; color: string }[] = [
    { key: "expired", label: "Expirés", count: expiredCount, color: "red" },
    { key: "week", label: "Cette semaine", count: expiresThisWeek, color: "orange" },
    { key: "month", label: "Ce mois", count: expiresThisMonth, color: "amber" },
    { key: "all", label: "Tous", count: latestPerClient.length, color: "gray" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 via-red-600 to-orange-500 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
              <CalendarX2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Fins d'abonnement
              </h1>
              <p className="text-rose-100 text-sm mt-0.5">
                Suivez les abonnements expirés et ceux qui arrivent à échéance
              </p>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <p className="text-rose-100 text-xs font-medium uppercase tracking-wider">
                Expirés
              </p>
              <p className="text-3xl font-bold mt-1">{expiredCount}</p>
              <p className="text-rose-200 text-xs mt-0.5">clients</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <p className="text-rose-100 text-xs font-medium uppercase tracking-wider">
                Cette semaine
              </p>
              <p className="text-3xl font-bold mt-1">{expiresThisWeek}</p>
              <p className="text-rose-200 text-xs mt-0.5">dans 7 jours</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <p className="text-rose-100 text-xs font-medium uppercase tracking-wider">
                Ce mois
              </p>
              <p className="text-3xl font-bold mt-1">{expiresThisMonth}</p>
              <p className="text-rose-200 text-xs mt-0.5">dans 30 jours</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-1 py-1 shadow-sm">
            <Filter className="h-4 w-4 text-gray-400 ml-2" />
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === f.key
                    ? f.color === "red"
                      ? "bg-red-500 text-white shadow"
                      : f.color === "orange"
                        ? "bg-orange-500 text-white shadow"
                        : f.color === "amber"
                          ? "bg-amber-500 text-white shadow"
                          : "bg-gray-700 text-white shadow"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    filter === f.key ? "bg-white/30" : "bg-gray-100"
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="h-6 w-6 animate-spin text-rose-400" />
            <span className="ml-2 text-gray-500 text-sm">Chargement...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-gray-700 font-semibold">Aucun abonnement trouvé</p>
            <p className="text-gray-400 text-sm mt-1">
              {filter === "expired"
                ? "Aucun abonnement expiré pour le moment."
                : filter === "week"
                  ? "Aucun abonnement n'expire dans les 7 prochains jours."
                  : filter === "month"
                    ? "Aucun abonnement n'expire ce mois-ci."
                    : "Aucun abonnement enregistré."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((payment) => {
              const days = getDaysUntilExpiry(payment.endDate);
              const isExpired = days < 0;
              const isUrgent = days >= 0 && days <= 7;

              return (
                <div
                  key={payment.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                    isExpired
                      ? "border-red-200"
                      : isUrgent
                        ? "border-orange-200"
                        : "border-gray-100"
                  }`}
                >
                  {isExpired && (
                    <div className="h-1 bg-gradient-to-r from-red-500 to-rose-400" />
                  )}
                  {isUrgent && !isExpired && (
                    <div className="h-1 bg-gradient-to-r from-orange-400 to-amber-400" />
                  )}

                  <div className="p-4 flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {payment.client.imagePath ? (
                        <img
                          src={payment.client.imagePath}
                          alt={payment.client.name}
                          className="h-12 w-12 rounded-full object-cover border-2 border-gray-100"
                        />
                      ) : (
                        <div
                          className={`h-12 w-12 rounded-full flex items-center justify-center border-2 ${
                            isExpired
                              ? "bg-red-50 border-red-200 text-red-400"
                              : isUrgent
                                ? "bg-orange-50 border-orange-200 text-orange-400"
                                : "bg-gray-50 border-gray-200 text-gray-400"
                          }`}
                        >
                          <UserCircle2 className="h-7 w-7" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {payment.client.name}
                        </p>
                        <StatusBadge days={days} />
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {SUBSCRIPTION_FR[payment.subscription] || payment.subscription}
                          {" · "}
                          {payment.amount.toLocaleString()} FCFA
                        </span>
                        <span className="text-xs text-gray-400">
                          Fin :{" "}
                          {new Date(payment.endDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <Link
                      href={`/dashboard/payments/new?clientId=${payment.client.id}`}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isExpired || isUrgent
                          ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      Renouveler
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
