"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Shield,
  CreditCard,
  Calendar,
  Lock,
  Users,
  DollarSign,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companyInfo, setCompanyInfo] = useState<{
    subscriptionType: string | null;
    subscriptionEndDate: Date | null;
    clientRegistrationCount: number;
    maxClientRegistrations: number;
    paymentCount: number;
    maxPayments: number;
  } | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
    } else {
      const fetchCompanyInfo = async () => {
        setLoadingCompany(true);
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
            subscriptionEndDate: data.subscriptionEndDate
              ? new Date(data.subscriptionEndDate)
              : null,
          });
        } catch (err: any) {
          toast.error(err.message, { duration: 4000 });
        } finally {
          setLoadingCompany(false);
        }
      };

      fetchCompanyInfo();
    }
  }, [session, status, router]);

  if (status === "loading" || loadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-base sm:text-lg text-gray-600">
          Chargement...
        </span>
      </div>
    );
  }

  // Format subscription end date
  const formatDate = (date) => {
    if (!date) return "Non défini";
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime())
      ? "Date invalide"
      : parsedDate.toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
  };

  // Calculate the percentage for progress bars
  const calculatePercentage = (current, max) => {
    if (!max || max === 0) return 100;
    const percentage = (current / max) * 100;
    return Math.min(percentage, 100); // Ensure it doesn't exceed 100%
  };

  // Get progress bar color based on percentage
  const getProgressColor = (percentage) => {
    if (percentage < 50) return "bg-green-500";
    if (percentage < 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Subscription type text mapping
  const getSubscriptionText = (type: string | null) => {
    switch (type) {
      case "free":
        return "Essai gratuit";
      case "premium":
        return "Pour Gbô";
      case "enterprise":
        return "Entreprise";
      default:
        return "Non abonné";
    }
  };

  const clientPercentage = calculatePercentage(
    companyInfo?.clientRegistrationCount || 0,
    companyInfo?.maxClientRegistrations || 0
  );
  const paymentPercentage = calculatePercentage(
    companyInfo?.paymentCount || 0,
    companyInfo?.maxPayments || 0
  );

  return (
    <div className="container mx-auto px-4 py-6 sm:p-6 lg:p-8">
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-2xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center space-x-3 mb-4 sm:mb-6">
          <User
            className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600"
            aria-hidden="true"
          />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Mon Profil
          </h1>
        </div>

        <div className="space-y-5 sm:space-y-6" role="list">
          {/* Section: Informations Personnelles */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-medium text-gray-800 mb-3">
              Informations Personnelles
            </h2>

            <div className="space-y-3">
              {/* Email */}
              <div
                className="flex items-center"
                role="listitem"
                aria-label="Courriel"
              >
                <Mail
                  className="h-5 w-5 text-gray-400 mr-2"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-gray-700">
                  Courriel :
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {session?.user?.email || "N/D"}
                </span>
              </div>

              {/* Role */}
              <div
                className="flex items-center"
                role="listitem"
                aria-label="Rôle"
              >
                <Shield
                  className="h-5 w-5 text-gray-400 mr-2"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-gray-700">
                  Rôle :
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {session?.user?.role || "N/D"}
                </span>
              </div>

              {/* Password */}
              <div
                className="flex items-center"
                role="listitem"
                aria-label="Mot de passe"
              >
                <Lock
                  className="h-5 w-5 text-gray-400 mr-2"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-gray-700">
                  Mot de passe :
                </span>
                <span className="ml-2 text-sm text-gray-900">********</span>
                <span className="ml-2 text-xs text-gray-500">(Sécurisé)</span>
              </div>
            </div>
          </div>

          {/* Section: Abonnement */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-medium text-gray-800 mb-3">
              Abonnement
            </h2>

            <div className="space-y-3">
              {/* Subscription Type */}
              <div
                className="flex items-center"
                role="listitem"
                aria-label="Type d'abonnement"
              >
                <CreditCard
                  className="h-5 w-5 text-gray-400 mr-2"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-gray-700">
                  Type d'abonnement :
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {getSubscriptionText(companyInfo?.subscriptionType)}
                </span>
              </div>

              {/* Subscription End Date */}
              <div
                className="flex items-center"
                role="listitem"
                aria-label="Date de fin d'abonnement"
              >
                <Calendar
                  className="h-5 w-5 text-gray-400 mr-2"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-gray-700">
                  Date de fin d'abonnement :
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {formatDate(companyInfo?.subscriptionEndDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Limites d'utilisation */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-medium text-gray-800 mb-3">
              Limites d'utilisation
            </h2>

            <div className="space-y-4">
              {/* Client Registration Count with Progress Bar */}
              <div role="listitem" aria-label="Inscriptions de clients">
                <div className="flex items-center mb-1">
                  <Users
                    className="h-5 w-5 text-gray-400 mr-2"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Inscriptions de clients :
                  </span>
                  <span className="ml-2 text-sm text-gray-900">
                    {companyInfo?.clientRegistrationCount || 0} /{" "}
                    {companyInfo?.maxClientRegistrations || "Illimité"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${getProgressColor(
                      clientPercentage
                    )}`}
                    style={{ width: `${clientPercentage}%` }}
                    aria-valuenow={clientPercentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                {clientPercentage >= 80 &&
                  companyInfo?.maxClientRegistrations !== 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Attention : Vous approchez de votre limite d'inscriptions
                      !
                    </p>
                  )}
              </div>

              {/* Payment Count with Progress Bar */}
              <div role="listitem" aria-label="Paiements">
                <div className="flex items-center mb-1">
                  <DollarSign
                    className="h-5 w-5 text-gray-400 mr-2"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Paiements :
                  </span>
                  <span className="ml-2 text-sm text-gray-900">
                    {companyInfo?.paymentCount || 0} /{" "}
                    {companyInfo?.maxPayments || "Illimité"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${getProgressColor(
                      paymentPercentage
                    )}`}
                    style={{ width: `${paymentPercentage}%` }}
                    aria-valuenow={paymentPercentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                {paymentPercentage >= 80 && companyInfo?.maxPayments !== 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    Attention : Vous approchez de votre limite de paiements !
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
