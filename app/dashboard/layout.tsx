"use client";

import Link from "next/link";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  LogOut,
  Menu,
  Bell,
  User,
  ChevronDown,
  Dumbbell,
  TrendingUp,
  Calendar,
  History,
  AlertTriangle,
  AlertCircle,
  ReceiptCent,
  Crown,
  Star,
  Gem,
  Sparkles,
  Zap,
  Shield,
  Gift,
  Trophy,
  Rocket,
  QrCode,
  CalendarX2,
} from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { differenceInDays } from "date-fns";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession<any>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [companyInfo, setCompanyInfo] = useState<{
    subscriptionType: string | null;
    clientRegistrationCount: number;
    maxClientRegistrations: number;
    paymentCount: number;
    maxPayments: number;
    subscriptionEndDate: Date | null;
  } | null>(null);
  const [subscriptionWarning, setSubscriptionWarning] = useState<{
    message: string;
    severity: "warning" | "error";
    daysRemaining?: number;
  } | null>(null);

  useEffect(() => {
    if ((session?.user as any)?.role !== "manager") {
      router.push("/dashboard/clients");
    }
  }, [session, router]);

  // Fetch company details from the API
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (status !== "authenticated" || !session?.user) return;

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
      } catch (err: unknown) {
        toast.error((err as Error).message, { duration: 4000 });
      }
    };
    fetchCompanyInfo();
  }, [session, status]);

  // Check subscription expiry based on companyInfo.subscriptionEndDate
  useEffect(() => {
    if (companyInfo?.subscriptionEndDate) {
      const endDate = companyInfo.subscriptionEndDate;
      const today = new Date();
      const daysRemaining = differenceInDays(endDate, today);

      if (daysRemaining <= 0) {
        setSubscriptionWarning({
          message:
            "Votre abonnement a expiré. Veuillez renouveler votre abonnement. Contactez-nous pour plus d'informations au +225 05 84 18 53 67 merci.",
          severity: "error",
          daysRemaining: 0,
        });
      } else if (daysRemaining <= 4) {
        setSubscriptionWarning({
          message: `Votre abonnement expire dans ${daysRemaining} jour${
            daysRemaining === 1 ? "" : "s"
          }. Veuillez envisager de renouveler.`,
          severity: "warning",
          daysRemaining,
        });
      } else {
        setSubscriptionWarning(null);
      }
    } else {
      setSubscriptionWarning(null);
    }
  }, [companyInfo]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notification");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des notifications :",
          error,
        );
      }
    };

    fetchNotifications();
  }, []);

  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
    setIsProfileOpen(false);
    toast.success("Déconnexion réussie !", { duration: 3000 });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/");
    return null;
  }

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
        };
      case "premium":
        return {
          bg: "bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-600",
          shadow: "shadow-xl shadow-amber-200/50",
          border: "border-amber-300/50",
          glow: "before:absolute before:inset-0 before:bg-gradient-to-r before:from-amber-400/30 before:to-orange-400/30 before:blur-xl before:-z-10",
          particles:
            "after:absolute after:inset-0 after:bg-gradient-to-r after:from-yellow-300/10 after:to-amber-300/10 after:animate-pulse",
        };
      case "enterprise":
        return {
          bg: "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700",
          shadow: "shadow-xl shadow-blue-300/50",
          border: "border-blue-400/50",
          glow: "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-400/30 before:to-purple-400/30 before:blur-xl before:-z-10",
          particles:
            "after:absolute after:inset-0 after:bg-gradient-to-r after:from-blue-300/10 after:to-purple-300/10 after:animate-pulse",
        };
      default:
        return {
          bg: "bg-white",
          shadow: "shadow-md shadow-gray-200/50",
          border: "border-gray-200",
          glow: "",
          particles: "",
        };
    }
  };

  // Get plan icon with enhanced styling
  const getPlanIcon = (plan: string | null | undefined) => {
    const iconClass = "h-4 sm:h-5 w-4 sm:w-5";
    switch (plan) {
      case "free":
        return <Star className={`${iconClass} drop-shadow-sm`} />;
      case "premium":
        return (
          <Crown className={`${iconClass} drop-shadow-sm animate-pulse`} />
        );
      case "enterprise":
        return <Gem className={`${iconClass} drop-shadow-sm animate-bounce`} />;
      default:
        return <CreditCard className={iconClass} />;
    }
  };

  // Get plan feature icons
  const getPlanFeatureIcons = (plan: string | null | undefined) => {
    switch (plan) {
      case "free":
        return [
          <Shield key="shield" className="h-3 w-3 text-white/80" />,
          <Gift key="gift" className="h-3 w-3 text-white/80" />,
        ];
      case "premium":
        return [
          <Sparkles
            key="sparkles"
            className="h-3 w-3 text-white/80 animate-pulse"
          />,
          <Zap key="zap" className="h-3 w-3 text-white/80" />,
          <Trophy key="trophy" className="h-3 w-3 text-white/80" />,
        ];
      case "enterprise":
        return [
          <Rocket
            key="rocket"
            className="h-3 w-3 text-white/80 animate-bounce"
          />,
          <Crown key="crown" className="h-3 w-3 text-white/80" />,
          <Gem key="gem" className="h-3 w-3 text-white/80 animate-pulse" />,
          <Shield key="shield" className="h-3 w-3 text-white/80" />,
        ];
      default:
        return [];
    }
  };

  // Enhanced plan badge styling
  const getPlanBadgeStyle = (plan: string | null | undefined) => {
    switch (plan) {
      case "free":
        return "bg-white/25 text-white border border-white/40 backdrop-blur-md shadow-lg shadow-green-900/20";
      case "premium":
        return "bg-white/25 text-white border border-white/40 backdrop-blur-md shadow-lg shadow-amber-900/20 animate-pulse";
      case "enterprise":
        return "bg-white/25 text-white border border-white/40 backdrop-blur-md shadow-lg shadow-blue-900/20 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] before:animate-[shimmer_2s_infinite]";
      default:
        return "bg-gray-200 text-gray-900 border border-gray-300";
    }
  };

  // Plan text with enhanced features
  const getPlanText = (plan: string | null | undefined) => {
    switch (plan) {
      case "free":
        return "Standard";
      case "premium":
        return "Premium";
      case "enterprise":
        return "Platinum";
      default:
        return "Non abonné";
    }
  };

  // Plan description for tooltip
  const getPlanDescription = (plan: string | null | undefined) => {
    switch (plan) {
      case "free":
        return "Fonctionnalités de base • Support standard";
      case "premium":
        return "Fonctionnalités avancées • Support prioritaire • Analytics";
      case "enterprise":
        return "Toutes les fonctionnalités • Support 24/7 • API • Personnalisation";
      default:
        return "Aucun plan actif";
    }
  };

  // Check if the user has the "manager" role
  const isManager = (session?.user as any)?.role === "manager";
  const isStandard = companyInfo?.subscriptionType !== "free";

  const headerStyle = getHeaderStyle(companyInfo?.subscriptionType);
  const planIcon = getPlanIcon(companyInfo?.subscriptionType);
  const planFeatureIcons = getPlanFeatureIcons(companyInfo?.subscriptionType);
  const isColoredHeader =
    companyInfo?.subscriptionType &&
    companyInfo?.subscriptionType !== "default";

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Subscription warning banner */}
        {subscriptionWarning && subscriptionWarning.daysRemaining !== 0 && (
          <div
            className={`w-full py-2 sm:py-3 px-3 sm:px-4 text-center relative overflow-hidden ${
              subscriptionWarning.severity === "warning"
                ? "bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-800 border-b border-yellow-200"
                : "bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border-b border-red-200"
            }`}
          >
            <div className="container mx-auto flex items-center justify-center space-x-1 sm:space-x-2 relative z-10">
              {subscriptionWarning.severity === "warning" ? (
                <AlertTriangle className="h-4 sm:h-5 w-4 sm:w-5 animate-pulse" />
              ) : (
                <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 animate-bounce" />
              )}
              <span className="font-medium text-sm sm:text-base">
                {subscriptionWarning.message}
              </span>
              {subscriptionWarning.severity === "warning" && (
                <Link
                  href="/subscription/renew"
                  className="ml-2 sm:ml-4 px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Renouveler maintenant
                </Link>
              )}
              {subscriptionWarning.severity === "error" && (
                <Link
                  href="/subscription/renew"
                  className="ml-2 sm:ml-4 px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Renouveler maintenant
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Navbar with plan-themed styling */}
        <nav
          className={`${headerStyle.bg} ${headerStyle.shadow} border-b ${headerStyle.border} sticky top-0 z-30 relative ${headerStyle.glow} `}
        >
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
              {/* Left section (Menu and Enhanced Logo) */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`lg:hidden ${isColoredHeader ? "text-white hover:text-white/80 hover:bg-white/10" : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"} focus:outline-none p-2 rounded-lg transition-all duration-200`}
                  aria-label="Toggle menu"
                >
                  <Menu className="h-5 sm:h-6 w-5 sm:w-6" />
                </button>
                {subscriptionWarning?.daysRemaining !== 0 && (
                  <Link href="/dashboard" className="flex items-center group">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className={`${
                          isColoredHeader
                            ? "bg-white/20 text-white backdrop-blur-sm border border-white/30"
                            : "bg-blue-600 text-white"
                        } p-2 sm:p-3 rounded-xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-12`}
                      >
                        <Dumbbell className="h-5 sm:h-6 w-5 sm:w-6" />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-xl sm:text-2xl font-bold ${
                            isColoredHeader ? "text-white" : "text-blue-600"
                          } transition-all duration-300 group-hover:scale-105`}
                        >
                          E-Gym
                        </span>
                        {isColoredHeader && (
                          <span className="text-xs text-white/70 font-medium">
                            Gestion Pro
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )}
              </div>

              {/* Right section (Enhanced Plan, Notifications, Profile) */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                {subscriptionWarning?.daysRemaining !== 0 && (
                  <>
                    {/* Enhanced subscription plan display */}
                    <div className="flex items-center space-x-2 sm:space-x-3 group">
                      <div
                        className={`${isColoredHeader ? "text-white" : "text-gray-500"} transition-transform duration-300 group-hover:scale-110`}
                      >
                        {planIcon}
                      </div>
                      <div className="hidden sm:flex flex-col">
                        <span
                          className={`text-xs font-medium ${
                            isColoredHeader ? "text-white/90" : "text-gray-600"
                          }`}
                        >
                          Plan actuel
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`px-3 py-1.5 rounded-full text-sm font-bold ${getPlanBadgeStyle(
                              companyInfo?.subscriptionType,
                            )} flex items-center gap-1.5 transition-all duration-300 hover:scale-105`}
                          >
                            {getPlanText(companyInfo?.subscriptionType)}
                            <div className="flex items-center gap-0.5">
                              {planFeatureIcons}
                            </div>
                          </span>
                        </div>
                      </div>

                      {/* Mobile plan badge */}
                      <div className="sm:hidden">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${getPlanBadgeStyle(
                            companyInfo?.subscriptionType,
                          )} flex items-center gap-1`}
                          title={getPlanDescription(
                            companyInfo?.subscriptionType,
                          )}
                        >
                          {getPlanText(companyInfo?.subscriptionType)}
                        </span>
                      </div>
                    </div>

                    {/* Plan benefits indicator */}
                    {isColoredHeader && (
                      <div className="hidden lg:flex items-center space-x-1 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                        <span className="text-xs text-white/80 font-medium">
                          {companyInfo?.clientRegistrationCount || 0}/
                          {companyInfo?.maxClientRegistrations || 0} clients
                        </span>
                        <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                        <span className="text-xs text-white/80 font-medium">
                          {companyInfo?.paymentCount || 0}/
                          {companyInfo?.maxPayments || 0} paiements
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Enhanced Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsProfileOpen(!isProfileOpen);
                      setIsNotificationOpen(false);
                    }}
                    className={`flex items-center ${
                      isColoredHeader
                        ? "text-white hover:text-white/80 hover:bg-white/10"
                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                    } focus:outline-none transition-all duration-200 p-2 rounded-xl group`}
                  >
                    <div
                      className={`${
                        isColoredHeader
                          ? "bg-white/20 text-white backdrop-blur-sm border border-white/30"
                          : "bg-blue-100 text-blue-600"
                      } rounded-full p-2 transition-all duration-300 group-hover:scale-110`}
                    >
                      <User className="h-4 sm:h-5 w-4 sm:w-5" />
                    </div>
                    <div className="hidden sm:flex flex-col ml-3 text-left">
                      <span
                        className={`font-semibold text-sm ${
                          isColoredHeader ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {session.user?.email?.split("@")[0] || "Admin"}
                      </span>
                      <span
                        className={`text-xs ${
                          isColoredHeader ? "text-white/70" : "text-gray-500"
                        }`}
                      >
                        {(session?.user as any)?.role === "manager"
                          ? "Gestionnaire"
                          : "Coach"}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 ml-1 transition-transform duration-200 group-hover:rotate-180" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl py-2 border border-gray-100 z-50 backdrop-blur-xl">
                      {subscriptionWarning?.daysRemaining !== 0 && (
                        <>
                          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">
                                  {session.user?.email?.split("@")[0] ||
                                    "Admin"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(session?.user as any)?.role === "manager"
                                    ? "Gestionnaire"
                                    : "Coach"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Link
                            href="/dashboard/profile"
                            className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 text-sm transition-all duration-200 group"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <User className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
                            <span>Mon profil</span>
                          </Link>
                          <div className="border-t border-gray-100 my-1"></div>
                        </>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center px-4 py-3 text-red-600 hover:bg-red-50 text-sm transition-all duration-200 group"
                      >
                        <LogOut className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  )}
                  {isManager && (
                    <div className="relative">
                      <button
                        onClick={() => {
                          setIsNotificationOpen(!isNotificationOpen);
                          setIsProfileOpen(false);
                        }}
                        className={`${
                          isColoredHeader
                            ? "text-white hover:text-white/80 hover:bg-white/10"
                            : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                        } p-2 sm:p-2.5 rounded-xl focus:outline-none relative transition-all duration-200 transform hover:scale-110`}
                      >
                        <Bell className="h-5 w-5" />
                        {notifications.filter(
                          (n: { isRead: boolean }) => !n.isRead,
                        ).length > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                            {
                              notifications.filter(
                                (n: { isRead: boolean }) => !n.isRead,
                              ).length
                            }
                          </span>
                        )}
                      </button>

                      {isNotificationOpen && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl py-2 border border-gray-100 z-50 backdrop-blur-xl">
                          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <Bell className="h-5 w-5 text-blue-600" />
                                Notifications
                              </h3>
                              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                                {
                                  notifications.filter(
                                    (n: { isRead: boolean }) => !n.isRead,
                                  ).length
                                }{" "}
                                nouvelles
                              </span>
                            </div>
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="px-4 py-8 text-center">
                                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">
                                  Aucune notification
                                </p>
                                <p className="text-gray-400 text-sm">
                                  Vous êtes à jour !
                                </p>
                              </div>
                            ) : (
                              notifications.map((notification: any) => (
                                <div
                                  key={notification.id}
                                  className={`px-4 py-4 hover:bg-gray-50 border-l-4 transition-all duration-200 ${
                                    notification.type === "CLIENT_REGISTERED"
                                      ? "border-blue-500 bg-blue-50/30"
                                      : "border-green-500 bg-green-50/30"
                                  }`}
                                >
                                  <div className="flex items-start space-x-3">
                                    <div
                                      className={`p-2 rounded-full ${
                                        notification.type ===
                                        "CLIENT_REGISTERED"
                                          ? "bg-blue-100 text-blue-600"
                                          : "bg-green-100 text-green-600"
                                      }`}
                                    >
                                      {notification.type ===
                                      "CLIENT_REGISTERED" ? (
                                        <Users className="h-4 w-4" />
                                      ) : (
                                        <CreditCard className="h-4 w-4" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-gray-800">
                                        {notification.type ===
                                        "CLIENT_REGISTERED"
                                          ? "Nouveau client enregistré"
                                          : "Paiement reçu"}
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-2">
                                        {notification.createdAt}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                            <div className="px-4 py-3 text-center border-t border-gray-100 bg-gray-50">
                              <Link
                                href="/dashboard/notifications"
                                className="text-blue-600 hover:text-blue-800 text-sm font-semibold inline-flex items-center gap-1 transition-colors duration-200"
                              >
                                Voir toutes les notifications
                                <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex flex-1">
          <aside
            className={`lg:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm ${
              isMenuOpen
                ? "fixed top-0 left-0 bottom-0 z-40 pt-16 overflow-y-auto"
                : "hidden"
            } lg:static lg:pt-0 lg:overflow-y-visible`}
          >
            <div className="flex-1 p-4 lg:p-6">
              <div className="lg:hidden flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-800">Menu principal</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              <nav className="space-y-1">
                {subscriptionWarning?.daysRemaining !== 0 && (
                  <>
                    {isManager ? (
                      // Enhanced Navigation for Managers
                      <>
                        <Link
                          href="/dashboard"
                          className="flex items-center text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 px-4 py-3 rounded-xl transition-all duration-200 group"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                            <LayoutDashboard className="h-4 w-4" />
                          </div>
                          <span className="font-medium">Tableau de bord</span>
                        </Link>

                        <div className="pt-4">
                          <div className="flex items-center px-4 mb-3">
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                            <span className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Gestion
                            </span>
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                          </div>

                          <Link
                            href="/dashboard/clients"
                            className="flex items-center text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-600 px-4 py-3 rounded-xl transition-all duration-200 group"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <div className="bg-green-100 text-green-600 p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                              <Users className="h-4 w-4" />
                            </div>
                            <span className="font-medium">Clients</span>
                          </Link>

                          <Link
                            href="/dashboard/payments"
                            className="flex items-center text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 px-4 py-3 rounded-xl transition-all duration-200 group"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <div className="bg-purple-100 text-purple-600 p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                              <CreditCard className="h-4 w-4" />
                            </div>
                            <span className="font-medium">Paiements</span>
                          </Link>

                          <Link
                            href="/dashboard/subscriptions"
                            className="flex items-center text-gray-700 hover:bg-gradient-to-r hover:from-rose-50 hover:to-orange-50 hover:text-rose-600 px-4 py-3 rounded-xl transition-all duration-200 group"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <div className="bg-rose-100 text-rose-600 p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                              <CalendarX2 className="h-4 w-4" />
                            </div>
                            <span className="font-medium">Fins d&apos;abonnement</span>
                          </Link>

                          {/* <Link
                            href="/dashboard/qr-code"
                            className="flex items-center text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 px-4 py-3 rounded-xl transition-all duration-200 group"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                              <QrCode className="h-4 w-4" />
                            </div>
                            <span className="font-medium">Mon QR Code</span>
                          </Link> */}
                          {/* <Link
                            href="/dashboard/stock"
                            className="flex items-center text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600 px-4 py-3 rounded-xl transition-all duration-200 group"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                              <TrendingUp className="h-4 w-4" />
                            </div>
                            <span className="font-medium">
                              Gestionnaire de Stock
                            </span>
                          </Link> */}

                          {isStandard && (
                            <>
                              <Link
                                href="/dashboard/calendar"
                                className="flex items-center text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 hover:text-orange-600 px-4 py-3 rounded-xl transition-all duration-200 group"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <div className="bg-orange-100 text-orange-600 p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                                  <Calendar className="h-4 w-4" />
                                </div>
                                <span className="font-medium">Calendrier</span>
                                <div className="ml-auto">
                                  <span className="bg-gradient-to-r from-orange-400 to-amber-400 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                    Pro
                                  </span>
                                </div>
                              </Link>

                              <Link
                                href="/dashboard/historic"
                                className="flex items-center text-gray-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:text-cyan-600 px-4 py-3 rounded-xl transition-all duration-200 group"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <div className="bg-cyan-100 text-cyan-600 p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                                  <History className="h-4 w-4" />
                                </div>
                                <span className="font-medium">Historique</span>
                                <div className="ml-auto">
                                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                    Pro
                                  </span>
                                </div>
                              </Link>
                            </>
                          )}
                        </div>

                        <div className="pt-4">
                          <div className="flex items-center px-4 mb-3">
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                            <span className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Rapports
                            </span>
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                          </div>

                          <Link
                            href="/dashboard/reports"
                            className="flex items-center text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600 px-4 py-3 rounded-xl transition-all duration-200 group"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                              <TrendingUp className="h-4 w-4" />
                            </div>
                            <span className="font-medium">Analyse</span>
                          </Link>

                          <Link
                            href="/dashboard/factures"
                            className="flex items-center text-gray-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:text-teal-600 px-4 py-3 rounded-xl transition-all duration-200 group"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <div className="bg-teal-100 text-teal-600 p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                              <ReceiptCent className="h-4 w-4" />
                            </div>
                            <span className="font-medium">Factures</span>
                          </Link>
                        </div>
                      </>
                    ) : (
                      // Enhanced Navigation for Coaches
                      <>
                        <Link
                          href="/dashboard/clients"
                          className="flex items-center text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-600 px-4 py-3 rounded-xl transition-all duration-200 group"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="bg-green-100 text-green-600 p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                            <Users className="h-4 w-4" />
                          </div>
                          <span className="font-medium">Clients</span>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </nav>
            </div>

            {/* Enhanced Footer with Plan Benefits */}
            <div className="p-4 border-t border-gray-200">
              {subscriptionWarning?.daysRemaining !== 0 && (
                <div
                  className={`rounded-2xl p-4 ${
                    companyInfo?.subscriptionType === "enterprise"
                      ? "bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 border border-blue-200"
                      : companyInfo?.subscriptionType === "premium"
                        ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-200"
                        : "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className={`text-sm font-bold ${
                        companyInfo?.subscriptionType === "enterprise"
                          ? "text-blue-800"
                          : companyInfo?.subscriptionType === "premium"
                            ? "text-amber-800"
                            : "text-green-800"
                      }`}
                    >
                      E-Gym Pro
                    </h3>
                    <div className="flex items-center gap-1">
                      {getPlanIcon(companyInfo?.subscriptionType)}
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`${
                          companyInfo?.subscriptionType === "enterprise"
                            ? "text-blue-700"
                            : companyInfo?.subscriptionType === "premium"
                              ? "text-amber-700"
                              : "text-green-700"
                        } font-medium`}
                      >
                        Plan {getPlanText(companyInfo?.subscriptionType)}
                      </span>
                      <span
                        className={`${
                          companyInfo?.subscriptionType === "enterprise"
                            ? "text-blue-600"
                            : companyInfo?.subscriptionType === "premium"
                              ? "text-amber-600"
                              : "text-green-600"
                        } font-semibold`}
                      >
                        v1.0
                      </span>
                    </div>

                    {/* Usage Statistics */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Clients</span>
                        <span className="font-medium text-gray-800">
                          {companyInfo?.clientRegistrationCount || 0}/
                          {companyInfo?.maxClientRegistrations || 0}
                        </span>
                      </div>
                      <div
                        className={`w-full bg-white/50 rounded-full h-1.5 ${
                          companyInfo?.subscriptionType === "enterprise"
                            ? "bg-blue-100"
                            : companyInfo?.subscriptionType === "premium"
                              ? "bg-amber-100"
                              : "bg-green-100"
                        }`}
                      >
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            companyInfo?.subscriptionType === "enterprise"
                              ? "bg-gradient-to-r from-blue-400 to-purple-400"
                              : companyInfo?.subscriptionType === "premium"
                                ? "bg-gradient-to-r from-amber-400 to-orange-400"
                                : "bg-gradient-to-r from-green-400 to-emerald-400"
                          }`}
                          style={{
                            width: `${Math.min(100, ((companyInfo?.clientRegistrationCount || 0) / (companyInfo?.maxClientRegistrations || 1)) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <p
                      className={`text-xs ${
                        companyInfo?.subscriptionType === "enterprise"
                          ? "text-blue-600"
                          : companyInfo?.subscriptionType === "premium"
                            ? "text-amber-600"
                            : "text-green-600"
                      } font-medium`}
                    >
                      Prochaine mise à jour
                    </p>
                    <p
                      className={`text-xs ${
                        companyInfo?.subscriptionType === "enterprise"
                          ? "text-blue-700"
                          : companyInfo?.subscriptionType === "premium"
                            ? "text-amber-700"
                            : "text-green-700"
                      } font-bold`}
                    >
                      15/08/2025
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            {isMenuOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden backdrop-blur-sm"
                onClick={() => setIsMenuOpen(false)}
              ></div>
            )}

            {subscriptionWarning?.daysRemaining === 0 ? (
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-2xl">
                  <div className="bg-red-100 text-red-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Abonnement Expiré
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Votre abonnement a expiré. Contactez-nous pour renouveler
                    votre accès.
                  </p>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl">
                    <p className="font-semibold mb-2">
                      Contactez-nous sur WhatsApp
                    </p>
                    <p className="text-lg font-bold">+225 05 84 18 53 67</p>
                  </div>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
