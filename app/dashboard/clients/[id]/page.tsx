"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // Import Image for optimized image rendering
import {
  User,
  ArrowLeft,
  CreditCard,
  Calendar,
  AlertCircle,
  Eye,
  Heart,
  Target,
  Ruler,
  Scale,
  CalendarDays,
} from "lucide-react";

export default function ClientDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id; // Utiliser params.id au lieu de router.asPath
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  console.log("ID du client à partir des paramètres :", clientId); // Log de débogage

  // Récupérer les données du client et les paiements au montage
  useEffect(() => {
    const fetchClient = async () => {
      if (status === "loading") return;
      if (!session) {
        router.push("/");
        return;
      }

      // Vérifier si clientId est disponible
      if (!clientId || typeof clientId !== "string") {
        setError("ID du client invalide ou manquant");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/clients/${clientId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Échec de la récupération des données du client"
          );
        }

        setClient(data);
      } catch (err) {
        setError(
          err.message ||
            "Une erreur s'est produite lors de la récupération des données du client"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [session, status, router, clientId]);

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
        <div className="flex items-center gap-2 p-2 sm:p-3 bg-red-50 text-red-700 rounded-lg text-xs sm:text-sm">
          <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-center">
          <p className="font-medium text-sm sm:text-base">Client non trouvé</p>
        </div>
      </div>
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isManager = (session.user as any)?.role === "manager";

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/clients"
            className="mr-2 sm:mr-3 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6" />
          </Link>
          <div className="flex items-center gap-4">
            {/* Display Client Image */}
            {client.imagePath ? (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-blue-500 shadow-md">
                <Image
                  src={client.imagePath}
                  alt={`${client.name}'s profile picture`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority // Load the image with high priority for better UX
                />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 border-2 border-gray-300">
                <User className="h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12" />
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                {client.name}
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
                Détails du client, fiche médicale et statut de paiement
              </p>
            </div>
          </div>
        </div>
        {isManager && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href={`/dashboard/clients/${clientId}/edit`}
              className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 py-2 px-3 sm:px-4 rounded-lg font-medium flex items-center gap-2 text-xs sm:text-sm md:text-base transition shadow-md w-full sm:w-auto"
            >
              <User className="h-3 sm:h-4 md:h-5 w-3 sm:w-4 md:w-5" />
              Modifier le client
            </Link>
            <Link
              href="/dashboard/payments/new"
              className="bg-green-50 text-green-600 hover:bg-green-100 py-2 px-3 sm:px-4 rounded-lg font-medium flex items-center gap-2 text-xs sm:text-sm md:text-base transition shadow-md w-full sm:w-auto"
            >
              <CreditCard className="h-3 sm:h-4 md:h-5 w-3 sm:w-4 md:w-5" />
              Ajouter un paiement
            </Link>
          </div>
        )}
      </div>

      {/* Détails du client */}
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-4">
          Informations sur le client
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Email</p>
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-blue-500">✉️</span> {client.email || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Téléphone</p>
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-blue-500">📞</span> {client.phone || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">
              Date d'inscription
            </p>
            <p className="text-xs sm:text-sm md:text-base font-medium text-gray-800 flex items-center gap-1">
              <span className="text-blue-500">📅</span>{" "}
              {new Date(client.registrationDate).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>

      {/* Fiche Médicale */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 md:p-8 rounded-xl shadow-md">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-6 flex items-center">
          <Heart className="h-5 sm:h-6 md:h-7 w-5 sm:w-6 md:w-7 mr-2 text-blue-600" />
          Fiche Médicale et Objectifs
        </h2>

        {/* Informations Médicales */}
        <div className="mb-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-4">
            Informations Médicales
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <Ruler className="h-4 w-4 text-blue-500" />
                Taille
              </p>
              <p className="text-sm sm:text-base font-medium text-gray-800">
                {client.height ? `${client.height} cm` : "N/A"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <Scale className="h-4 w-4 text-blue-500" />
                Poids
              </p>
              <p className="text-sm sm:text-base font-medium text-gray-800">
                {client.weight ? `${client.weight} kg` : "N/A"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                Âge
              </p>
              <p className="text-sm sm:text-base font-medium text-gray-800">
                {client.age ? `${client.age} ans` : "N/A"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <Heart className="h-4 w-4 text-blue-500" />
                Pression artérielle
              </p>
              <p className="text-sm sm:text-base font-medium text-gray-800">
                {client.bloodPressure || "N/A"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                Conditions médicales
              </p>
              <p className="text-sm sm:text-base font-medium text-gray-800">
                {client.medicalConditions || "N/A"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                Allergies
              </p>
              <p className="text-sm sm:text-base font-medium text-gray-800">
                {client.allergies || "N/A"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                Blessures
              </p>
              <p className="text-sm sm:text-base font-medium text-gray-800">
                {client.injuries || "N/A"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                Médicaments
              </p>
              <p className="text-sm sm:text-base font-medium text-gray-800">
                {client.medications || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Objectifs Physiques */}
        <div>
          <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-4">
            Objectifs Physiques
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <Target className="h-4 w-4 text-blue-500" />
                Poids cible
              </p>
              <p className="text-sm sm:text-base font-medium text-gray-800">
                {client.targetWeight ? `${client.targetWeight} kg` : "N/A"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <Target className="h-4 w-4 text-blue-500" />
                Pourcentage de graisse corporelle cible
              </p>
              <p className="text-sm sm:text-base font-medium text-gray-800">
                {client.targetBodyFat ? `${client.targetBodyFat}%` : "N/A"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <Target className="h-4 w-4 text-blue-500" />
                Objectif physique
              </p>
              <p className="text-sm sm:text-base font-medium text-gray-800">
                {client.fitnessGoal
                  ? {
                      "weight loss": "Perte de poids",
                      "muscle gain": "Gain musculaire",
                      endurance: "Endurance",
                      "general fitness": "Condition physique générale",
                    }[client.fitnessGoal] || client.fitnessGoal
                  : "N/A"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                <Calendar className="h-4 w-4 text-blue-500" />
                Date de l'objectif
              </p>
              <p className="text-sm sm:text-base font-medium text-gray-800">
                {client.goalMilestone
                  ? new Date(client.goalMilestone).toLocaleDateString("fr-FR")
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des paiements */}
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-4">
          Statut de paiement
        </h2>
        {client.payments.length === 0 ? (
          <div className="text-gray-500 text-center py-6 sm:py-8 md:py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <CreditCard className="h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-xs sm:text-sm md:text-base">
              Aucun paiement trouvé
            </p>
            <p className="text-xs sm:text-sm mt-1">
              Ajoutez un paiement pour ce client pour commencer
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {client.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition border border-gray-100 hover:border-green-200"
              >
                <div className="mb-2 sm:mb-0">
                  <p className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base">
                    Abonnement{" "}
                    {payment.subscription === "Monthly"
                      ? "mensuel"
                      : payment.subscription === "Yearly"
                        ? "annuel"
                        : payment.subscription === "Weekly"
                          ? "hebdomadaire"
                          : payment.subscription === "Daily"
                            ? "quotidien"
                            : "trimestriel"}
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
                    <span
                      className={
                        payment.paymentStatus === "Paid"
                          ? "text-green-600"
                          : payment.paymentStatus === "Unpaid"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }
                    >
                      {payment.paymentStatus === "Paid"
                        ? "Payé"
                        : payment.paymentStatus === "Unpaid"
                          ? "Non payé"
                          : payment.paymentStatus || "N/A"}
                    </span>
                  </p>
                  {payment.nextPaymentDate && (
                    <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <span className="text-green-500">⏳</span> Prochain
                      paiement :{" "}
                      {new Date(payment.nextPaymentDate).toLocaleDateString(
                        "fr-FR"
                      )}
                    </p>
                  )}
                </div>
                {isManager && (
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <Link
                      href={`/dashboard/payments/${payment.id}`}
                      className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 transition w-full sm:w-auto"
                    >
                      <Eye className="h-3 sm:h-4 w-3 sm:w-4" />
                      Voir
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
