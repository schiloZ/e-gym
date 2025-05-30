"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CreditCard, ArrowLeft, Save, AlertCircle } from "lucide-react";

export default function PaymentEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const paymentId = params?.id;
  const [payment, setPayment] = useState({
    amount: "",
    subscription: "",
    method: "",
    status: "",
    paymentStatus: "",
    startDate: "",
    endDate: "",
    nextPaymentDate: "",
    paymentDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  console.log("ID du paiement à partir des paramètres :", paymentId);

  // Récupérer les données du paiement au montage
  useEffect(() => {
    const fetchPayment = async () => {
      if (status === "loading") return;
      if (!session) {
        router.push("/");
        return;
      }

      if (!paymentId || typeof paymentId !== "string") {
        setError("ID de paiement invalide ou manquant");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/payments/${paymentId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `Échec de la récupération des données du paiement (Statut : ${response.status})`
          );
        }

        const data = await response.json();
        setPayment({
          amount: data.amount?.toString() || "",
          subscription: data.subscription || "",
          method: data.method || "",
          status: data.status || "",
          paymentStatus: data.paymentStatus || "",
          startDate: data.startDate
            ? new Date(data.startDate).toISOString().split("T")[0]
            : "",
          endDate: data.endDate
            ? new Date(data.endDate).toISOString().split("T")[0]
            : "",
          nextPaymentDate: data.nextPaymentDate
            ? new Date(data.nextPaymentDate).toISOString().split("T")[0]
            : "",
          paymentDate: data.paymentDate
            ? new Date(data.paymentDate).toISOString().split("T")[0]
            : "",
        });
      } catch (err: any) {
        console.error("Erreur de récupération :", err);
        setError(
          err.message ||
            "Une erreur s'est produite lors de la récupération des données du paiement"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [session, status, router, paymentId]);

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(payment.amount),
          subscription: payment.subscription,
          method: payment.method,
          status: payment.status,
          paymentStatus: payment.paymentStatus,
          startDate: payment.startDate || undefined,
          endDate: payment.endDate || undefined,
          nextPaymentDate: payment.nextPaymentDate || undefined,
          paymentDate: payment.paymentDate || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Échec de la mise à jour du paiement (Statut : ${response.status})`
        );
      }

      setSuccess("Paiement mis à jour avec succès");
      setTimeout(() => router.push(`/dashboard/payments/${paymentId}`), 2000); // Redirection après 2 secondes
    } catch (err: any) {
      console.error("Erreur de mise à jour :", err);
      setError(
        err.message ||
          "Une erreur s'est produite lors de la mise à jour des données du paiement"
      );
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 p-2 sm:p-3 bg-red-50 text-red-700 rounded-lg text-xs sm:text-sm md:text-base">
          <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Link
            href={`/dashboard/payments/${paymentId}`}
            className="mr-2 sm:mr-3 text-green-600 hover:text-green-800"
          >
            <ArrowLeft className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center text-gray-800">
              <CreditCard className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6 mr-2 text-green-600" />
              Modifier le paiement
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
              Mettre à jour les détails du paiement
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire de modification */}
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md">
        {success && (
          <div className="mb-4 p-2 sm:p-3 bg-green-50 text-green-700 rounded-lg text-xs sm:text-sm md:text-base">
            <span>{success}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
              Montant (FCFA)
            </label>
            <input
              type="number"
              value={payment.amount}
              onChange={(e) =>
                setPayment({ ...payment, amount: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
              Abonnement
            </label>
            <select
              value={payment.subscription}
              onChange={(e) =>
                setPayment({ ...payment, subscription: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
              required
            >
              <option value="Monthly">Mensuel</option>
              <option value="Quarterly">Trimestriel</option>
              <option value="Yearly">Annuel</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
              Méthode de paiement
            </label>
            <select
              value={payment.method}
              onChange={(e) =>
                setPayment({ ...payment, method: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
              required
            >
              <option value="Cash">Espèces</option>
              <option value="Card">Carte</option>
              <option value="Mobile Money">Paiement mobile</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={payment.status}
              onChange={(e) =>
                setPayment({ ...payment, status: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
              required
            >
              <option value="Pending">En attente</option>
              <option value="Completed">Terminé</option>
              <option value="Failed">Échoué</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
              Statut du paiement
            </label>
            <select
              value={payment.paymentStatus}
              onChange={(e) =>
                setPayment({ ...payment, paymentStatus: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
              required
            >
              <option value="Paid">Payé</option>
              <option value="Unpaid">Non payé</option>
              <option value="Overdue">En retard</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              value={payment.startDate}
              onChange={(e) =>
                setPayment({ ...payment, startDate: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              value={payment.endDate}
              onChange={(e) =>
                setPayment({ ...payment, endDate: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
              Prochaine date de paiement
            </label>
            <input
              type="date"
              value={payment.nextPaymentDate}
              onChange={(e) =>
                setPayment({ ...payment, nextPaymentDate: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
              Date de paiement
            </label>
            <input
              type="date"
              value={payment.paymentDate}
              onChange={(e) =>
                setPayment({ ...payment, paymentDate: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-xs sm:text-sm md:text-base"
          >
            <Save className="h-4 sm:h-5 w-4 sm:w-5" />
            Enregistrer les modifications
          </button>
        </form>
      </div>
    </div>
  );
}
