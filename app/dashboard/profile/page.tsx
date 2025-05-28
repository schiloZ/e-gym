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
  Crown,
  Star,
  Zap,
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

  // Get enhanced header styling based on subscription plan
  const getHeaderStyle = (plan: string | null | undefined) => {
    switch (plan) {
      case "free":
        return {
          bg: "bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600",
          shadow: "shadow-xl shadow-green-200/50",
          border: "border-green-300/50",
          glow: "before:absolute before:inset-0 before:bg-gradient-to-r before:from-green-400/20 before:to-emerald-400/20 before:blur-xl before:-z-10",
          particles:
            'after:absolute after:inset-0 after:bg-[url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="1"%3E%3C/circle%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')] after:animate-pulse',
          textColor: "text-white",
          icon: Star,
        };
      case "premium":
        return {
          bg: "bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-600",
          shadow: "shadow-xl shadow-amber-200/50",
          border: "border-amber-300/50",
          glow: "before:absolute before:inset-0 before:bg-gradient-to-r before:from-amber-400/30 before:to-orange-400/30 before:blur-xl before:-z-10",
          particles:
            "after:absolute after:inset-0 after:bg-gradient-to-r after:from-yellow-300/10 after:to-amber-300/10 after:animate-pulse",
          textColor: "text-white",
          icon: Crown,
        };
      case "enterprise":
        return {
          bg: "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700",
          shadow: "shadow-xl shadow-blue-300/50",
          border: "border-blue-400/50",
          glow: "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-400/30 before:to-purple-400/30 before:blur-xl before:-z-10",
          particles:
            "after:absolute after:inset-0 after:bg-gradient-to-r after:from-blue-300/10 after:to-purple-300/10 after:animate-pulse",
          textColor: "text-white",
          icon: Zap,
        };
      default:
        return {
          bg: "bg-white",
          shadow: "shadow-md shadow-gray-200/50",
          border: "border-gray-200",
          glow: "",
          particles: "",
          textColor: "text-gray-800",
          icon: User,
        };
    }
  };

  // Get section styling based on subscription plan
  const getSectionStyle = (plan: string | null | undefined) => {
    switch (plan) {
      case "free":
        return "bg-gradient-to-br from-green-50 to-emerald-50 border-green-100";
      case "premium":
        return "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100";
      case "enterprise":
        return "bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100";
      default:
        return "bg-gray-50 border-gray-100";
    }
  };

  if (status === "loading" || loadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600" />
            <div className="absolute inset-0 h-6 w-6 sm:h-8 sm:w-8 animate-ping bg-blue-600 opacity-20 rounded-full"></div>
          </div>
          <span className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium">
            Chargement de votre profil...
          </span>
        </div>
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
    return Math.min(percentage, 100);
  };

  // Get progress bar color based on percentage and subscription
  const getProgressColor = (percentage, plan) => {
    if (percentage < 50) {
      switch (plan) {
        case "free":
          return "bg-gradient-to-r from-green-500 to-emerald-500";
        case "premium":
          return "bg-gradient-to-r from-amber-500 to-yellow-500";
        case "enterprise":
          return "bg-gradient-to-r from-blue-500 to-purple-500";
        default:
          return "bg-green-500";
      }
    }
    if (percentage < 75)
      return "bg-gradient-to-r from-yellow-500 to-orange-500";
    return "bg-gradient-to-r from-red-500 to-red-600";
  };

  // Subscription type text mapping
  const getSubscriptionText = (type: string | null) => {
    switch (type) {
      case "free":
        return "Standard";
      case "premium":
        return "Premium";
      case "enterprise":
        return "Platinium";
      default:
        return "Non abonné";
    }
  };

  const headerStyle = getHeaderStyle(companyInfo?.subscriptionType);
  const sectionStyle = getSectionStyle(companyInfo?.subscriptionType);
  const HeaderIcon = headerStyle.icon;

  const clientPercentage = calculatePercentage(
    companyInfo?.clientRegistrationCount || 0,
    companyInfo?.maxClientRegistrations || 0
  );
  const paymentPercentage = calculatePercentage(
    companyInfo?.paymentCount || 0,
    companyInfo?.maxPayments || 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-4 sm:py-6 lg:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[95%] sm:max-w-lg lg:max-w-4xl mx-auto">
          {/* Enhanced Header with Dynamic Styling */}
          <div
            className={`relative overflow-hidden rounded-t-2xl border-2 ${headerStyle.bg} ${headerStyle.shadow} ${headerStyle.border} ${headerStyle.glow} ${headerStyle.particles} p-4 sm:p-6 lg:p-8`}
          >
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="relative">
                    <div
                      className={`p-2 sm:p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30`}
                    >
                      <HeaderIcon
                        className={`h-6 w-6 sm:h-8 sm:w-8 ${headerStyle.textColor}`}
                      />
                    </div>
                    {companyInfo?.subscriptionType !== "free" &&
                      companyInfo?.subscriptionType && (
                        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-white/90 rounded-full flex items-center justify-center">
                          <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-500 fill-current" />
                        </div>
                      )}
                  </div>
                  <div className="text-center sm:text-left">
                    <h1
                      className={`text-xl sm:text-2xl lg:text-3xl font-bold ${headerStyle.textColor}`}
                    >
                      Mon Profil
                    </h1>
                    <p
                      className={`text-xs sm:text-sm opacity-90 ${headerStyle.textColor}`}
                    >
                      {getSubscriptionText(companyInfo?.subscriptionType)}
                    </p>
                  </div>
                </div>
                <div className="block">
                  <div
                    className={`px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30`}
                  >
                    <span
                      className={`text-xs sm:text-sm font-medium ${headerStyle.textColor}`}
                    >
                      {session?.user?.role || "Utilisateur"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-b-2xl shadow-xl border-2 border-t-0 border-gray-200">
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
              {/* Personal Information Section */}
              <div
                className={`${sectionStyle} p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    Informations Personnelles
                  </h2>
                </div>

                <div className="grid gap-3 sm:gap-4 lg:gap-6">
                  {/* Email */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-0">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <span className="font-medium text-gray-700 text-sm sm:text-base">
                        Courriel
                      </span>
                    </div>
                    <span className="text-gray-900 font-medium text-sm sm:text-base break-all">
                      {session?.user?.email || "N/D"}
                    </span>
                  </div>

                  {/* Role */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-0">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <span className="font-medium text-gray-700 text-sm sm:text-base">
                        Rôle
                      </span>
                    </div>
                    <span className="text-gray-900 font-medium text-sm sm:text-base">
                      {session?.user?.role || "N/D"}
                    </span>
                  </div>

                  {/* Password */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-0">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <span className="font-medium text-gray-700 text-sm sm:text-base">
                        Mot de passe
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 font-medium text-sm sm:text-base">
                        ********
                      </span>
                      <span className="text-xs text-green-600 bg-green-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                        Sécurisé
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Section */}
              <div
                className={`${sectionStyle} p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    Abonnement
                  </h2>
                </div>

                <div className="grid gap-3 sm:gap-4 lg:gap-6">
                  {/* Subscription Type */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-0">
                      <HeaderIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <span className="font-medium text-gray-700 text-sm sm:text-base">
                        Type d'abonnement
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 font-medium text-sm sm:text-base">
                        {getSubscriptionText(companyInfo?.subscriptionType)}
                      </span>
                      {companyInfo?.subscriptionType !== "free" &&
                        companyInfo?.subscriptionType && (
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
                        )}
                    </div>
                  </div>

                  {/* Subscription End Date */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-0">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <span className="font-medium text-gray-700 text-sm sm:text-base">
                        Date de fin
                      </span>
                    </div>
                    <span className="text-gray-900 font-medium text-sm sm:text-base break-words">
                      {formatDate(companyInfo?.subscriptionEndDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Usage Limits Section */}
              <div
                className={`${sectionStyle} p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                  <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    Limites d'utilisation
                  </h2>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {/* Client Registration Progress */}
                  <div className="p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        <span className="font-medium text-gray-700 text-sm sm:text-base">
                          Inscriptions de clients
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        {companyInfo?.clientRegistrationCount || 0} /{" "}
                        {companyInfo?.maxClientRegistrations || "∞"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                      <div
                        className={`h-2 sm:h-3 rounded-full transition-all duration-500 ease-out ${getProgressColor(clientPercentage, companyInfo?.subscriptionType)}`}
                        style={{ width: `${clientPercentage}%` }}
                      />
                    </div>
                    {clientPercentage >= 80 &&
                      companyInfo?.maxClientRegistrations !== 0 && (
                        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs sm:text-sm text-red-700 font-medium">
                            ⚠️ Attention : Vous approchez de votre limite
                            d'inscriptions !
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Payment Progress */}
                  <div className="p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        <span className="font-medium text-gray-700 text-sm sm:text-base">
                          Paiements
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        {companyInfo?.paymentCount || 0} /{" "}
                        {companyInfo?.maxPayments || "∞"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                      <div
                        className={`h-2 sm:h-3 rounded-full transition-all duration-500 ease-out ${getProgressColor(paymentPercentage, companyInfo?.subscriptionType)}`}
                        style={{ width: `${paymentPercentage}%` }}
                      />
                    </div>
                    {paymentPercentage >= 80 &&
                      companyInfo?.maxPayments !== 0 && (
                        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs sm:text-sm text-red-700 font-medium">
                            ⚠️ Attention : Vous approchez de votre limite de
                            paiements !
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
