"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CreditCard, ArrowLeft, AlertCircle } from "lucide-react";

export default function PaymentDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const paymentId = params.id;
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setPayment(data);
      } catch (err) {
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

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-center">
          <p className="font-medium text-sm sm:text-base md:text-lg">
            Paiement non trouvé
          </p>
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
            href="/dashboard/payments"
            className="mr-2 sm:mr-3 text-green-600 hover:text-green-800"
          >
            <ArrowLeft className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center text-gray-800">
              <CreditCard className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6 mr-2 text-green-600" />
              Détails du paiement
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
              Abonnement{" "}
              {(() => {
                const translations: Record<string, string> = {
                  Daily: "Quotidien",
                  Weekly: "Hebdomadaire",
                  Monthly: "Mensuel",
                  Quarterly: "Trimestriel",
                  Yearly: "Annuel",
                };
                return (
                  translations[payment.subscription] || payment.subscription
                );
              })()}{" "}
              pour {payment.client.name}
            </p>
          </div>
        </div>
      </div>

      {/* Détails du paiement */}
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-4">
          Informations sur le paiement
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <div>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Client
            </p>
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">👤</span> {payment.client.name}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Montant
            </p>
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">💰</span>{" "}
              {payment.amount.toLocaleString("fr-FR")} FCFA
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Abonnement
            </p>
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">📋</span>{" "}
              {(() => {
                const translations: Record<string, string> = {
                  Daily: "Quotidien",
                  Weekly: "Hebdomadaire",
                  Monthly: "Mensuel",
                  Quarterly: "Trimestriel",
                  Yearly: "Annuel",
                };
                return (
                  translations[payment.subscription] || payment.subscription
                );
              })()}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Méthode de paiement
            </p>
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">💳</span>{" "}
              {(() => {
                const translations: Record<string, string> = {
                  Cash: "Espèces",
                  "Credit Card": "Carte de crédit",
                  "Bank Transfer": "Virement bancaire",
                  "Mobile Money":
                    "Paiement mobile, MTN Money, Orange Money, Wave, etc.",
                };
                return translations[payment.method] || payment.method;
              })()}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Statut
            </p>
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">🔔</span>
              <span
                className={
                  payment.paymentStatus === "Paid"
                    ? "text-green-600"
                    : payment.paymentStatus === "Overdue"
                      ? "text-yellow-600"
                      : "text-red-600"
                }
              >
                {(() => {
                  const translations: Record<string, string> = {
                    Overdue: "En retard",
                    Paid: "Payé",
                    Unpaid: "Échoué",
                  };
                  return (
                    translations[payment.paymentStatus] ||
                    payment.paymentStatus ||
                    "N/A"
                  );
                })()}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Date de paiement
            </p>
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">📅</span>{" "}
              {payment.paymentDate
                ? new Date(payment.paymentDate).toLocaleDateString("fr-FR")
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Date de début
            </p>
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">📅</span>{" "}
              {new Date(payment.startDate).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Date de fin
            </p>
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">📅</span>{" "}
              {new Date(payment.endDate).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Prochaine date de paiement
            </p>
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">⏳</span>{" "}
              {payment.nextPaymentDate
                ? new Date(payment.nextPaymentDate).toLocaleDateString("fr-FR")
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Créé le
            </p>
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">📅</span>{" "}
              {new Date(payment.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Mis à jour le
            </p>
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-green-500">📅</span>{" "}
              {new Date(payment.updatedAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
