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

export default function PaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error("Erreur lors de la suppression du paiement :", error);
      }
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
    return null; // La redirection est gérée dans useEffect
  }

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
          {filteredPayments.length === 0 ? (
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
            filteredPayments.map((payment) => (
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
                    {payment.status}
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
        {filteredPayments.length > 0 && (
          <div className="mt-3 sm:mt-4 md:mt-6 text-center">
            <Link
              href="/dashboard/payments"
              className="text-green-600 hover:text-green-800 text-xs sm:text-sm md:text-base font-medium inline-flex items-center"
            >
              Voir tous les paiements
              <ArrowRight className="h-3 sm:h-4 md:h-5 w-3 sm:w-4 md:w-5 ml-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
