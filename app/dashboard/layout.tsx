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
  const { data: session, status } = useSession();
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
    if (session?.user?.role !== "manager") {
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
      const today = new Date(); // Current date and time: 03:52 PM GMT, May 23, 2025
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
      setSubscriptionWarning(null); // No warning if no subscription end date
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
          error
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
        Chargement...
      </div>
    );
  }

  if (!session) {
    router.push("/");
    return null;
  }

  // Determine plan badge style based on subscriptionType from companyInfo
  const getPlanBadgeStyle = (plan: string | null | undefined) => {
    switch (plan) {
      case "free":
        return "bg-green-200 text-green-900 border border-green-300"; // Vibrant green with a subtle border
      case "premium":
        return "bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 border border-amber-600 shadow-sm"; // Golden gradient with a metallic feel
      case "enterprise":
        return "bg-gradient-to-r from-blue-100 via-cyan-100 to-blue-100 text-blue-900 border border-blue-300 shadow-md"; // Diamond-like icy blue with a sparkling effect
      default:
        return "bg-gray-200 text-gray-900 border border-gray-300"; // Neutral gray with a clean look
    }
  };

  // Determine plan text based on subscriptionType from companyInfo
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

  // Check if the user has the "manager" role (if not, they are a coach)
  const isManager = session.user?.role === "manager";
  const isStandard = companyInfo?.subscriptionType !== "free";

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Subscription warning banner */}
        {subscriptionWarning && subscriptionWarning.daysRemaining !== 0 && (
          <div
            className={`w-full py-2 sm:py-3 px-3 sm:px-4 text-center ${
              subscriptionWarning.severity === "warning"
                ? "bg-yellow-50 text-yellow-800 border-b border-yellow-200"
                : "bg-red-50 text-red-800 border-b border-red-200"
            }`}
          >
            <div className="container mx-auto flex items-center justify-center space-x-1 sm:space-x-2">
              {subscriptionWarning.severity === "warning" ? (
                <AlertTriangle className="h-4 sm:h-5 w-4 sm:w-5" />
              ) : (
                <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5" />
              )}
              <span className="font-medium text-sm sm:text-base">
                {subscriptionWarning.message}
              </span>
              {subscriptionWarning.severity === "warning" && (
                <Link
                  href="/subscription/renew"
                  className="ml-2 sm:ml-4 px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium transition-colors"
                >
                  Renouveler maintenant
                </Link>
              )}
              {subscriptionWarning.severity === "error" && (
                <Link
                  href="/subscription/renew"
                  className="ml-2 sm:ml-4 px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm rounded bg-red-100 hover:bg-red-200 text-red-800 font-medium transition-colors"
                >
                  Renouveler maintenant
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Navbar */}
        <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-30">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
              {/* Left section (Menu and Logo) */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:hidden text-gray-600 hover:text-blue-600 focus:outline-none"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-5 sm:h-6 w-5 sm:w-6" />
                </button>
                {subscriptionWarning?.daysRemaining !== 0 && (
                  <Link href="/dashboard" className="flex items-center">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="bg-blue-600 text-white p-1 sm:p-2 rounded-lg">
                        <Dumbbell className="h-5 sm:h-6 w-5 sm:w-6" />
                      </div>
                      <span className="text-lg sm:text-xl font-bold text-blue-600">
                        E-Gym
                      </span>
                    </div>
                  </Link>
                )}
              </div>

              {/* Right section (Plan, Notifications, Profile) */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                {subscriptionWarning?.daysRemaining !== 0 && (
                  <>
                    {/* Display subscription plan */}
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <CreditCard className="h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        Plan :
                      </span>
                      <span
                        className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold ${getPlanBadgeStyle(
                          companyInfo?.subscriptionType
                        )}`}
                      >
                        {getPlanText(companyInfo?.subscriptionType)}
                      </span>
                    </div>

                    {isManager && (
                      <div className="relative">
                        <button
                          onClick={() => {
                            setIsNotificationOpen(!isNotificationOpen);
                            setIsProfileOpen(false);
                          }}
                          className="text-gray-600 hover:text-blue-600 p-1 sm:p-2 rounded-full hover:bg-gray-100 focus:outline-none relative"
                        >
                          <Bell className="h-4 sm:h-5 w-4 sm:w-5" />
                          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-3 sm:h-4 w-3 sm:w-4 flex items-center justify-center">
                            {notifications.filter((n) => !n.isRead).length || 0}
                          </span>
                        </button>

                        {isNotificationOpen && (
                          <div className="absolute right-0 mt-1 sm:mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg py-1 sm:py-2 border border-gray-200 z-50">
                            <div className="px-3 sm:px-4 py-1 sm:py-2 border-b border-gray-100">
                              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                                Notifications
                              </h3>
                            </div>
                            <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                              {notifications.length === 0 ? (
                                <div className="px-3 sm:px-4 py-2 sm:py-3 text-center text-gray-500 text-xs sm:text-sm">
                                  Aucune nouvelle notification
                                </div>
                              ) : (
                                notifications.map((notification) => (
                                  <div
                                    key={notification.id}
                                    className={`px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-50 border-l-4 ${
                                      notification.type === "CLIENT_REGISTERED"
                                        ? "border-blue-500"
                                        : "border-green-500"
                                    }`}
                                  >
                                    <p className="text-xs sm:text-sm font-medium text-gray-800">
                                      {notification.type === "CLIENT_REGISTERED"
                                        ? "Nouveau client enregistré"
                                        : "Paiement reçu"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {notification.createdAt}
                                    </p>
                                  </div>
                                ))
                              )}
                              <div className="px-3 sm:px-4 py-2 sm:py-3 text-center border-t border-gray-100">
                                <Link
                                  href="/dashboard/notifications"
                                  className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium"
                                >
                                  Voir toutes les notifications
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="relative">
                  <button
                    onClick={() => {
                      setIsProfileOpen(!isProfileOpen);
                      setIsNotificationOpen(false);
                    }}
                    className="flex items-center text-gray-600 hover:text-blue-600 focus:outline-none"
                  >
                    <div className="bg-blue-100 text-blue-600 rounded-full p-1">
                      <User className="h-4 sm:h-5 w-4 sm:w-5" />
                    </div>
                    <span className="hidden sm:block ml-1 sm:ml-2 font-medium text-sm sm:text-base">
                      {session.user?.email || "Utilisateur Admin"}
                    </span>
                    <ChevronDown className="h-3 sm:h-4 w-3 sm:w-4 ml-0.5 sm:ml-1" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-1 sm:mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg py-1 sm:py-2 border border-gray-200 z-50">
                      {subscriptionWarning?.daysRemaining !== 0 && (
                        <>
                          <Link
                            href="/dashboard/profile"
                            className="block px-3 sm:px-4 py-1 sm:py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 text-xs sm:text-sm"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <div className="flex items-center">
                              <User className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
                              <span>Mon profil</span>
                            </div>
                          </Link>
                          <div className="border-t border-gray-100 my-0.5 sm:my-1"></div>
                        </>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 sm:px-4 py-1 sm:py-2 text-red-600 hover:bg-red-50 flex items-center text-xs sm:text-sm"
                      >
                        <LogOut className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
                        <span>Déconnexion</span>
                      </button>
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
              isMenuOpen ? "fixed inset-0 z-40 pt-16" : "hidden"
            } lg:relative lg:pt-0`}
          >
            <div className="p-4 lg:p-6">
              <div className="lg:hidden flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-800">Menu principal</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <nav className="space-y-1">
                {subscriptionWarning?.daysRemaining !== 0 && (
                  <>
                    {isManager ? (
                      // Navigation for Managers (all links)
                      <>
                        <Link
                          href="/dashboard"
                          className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-5 w-5 mr-3 text-gray-500" />
                          <span className="font-medium">Tableau de bord</span>
                        </Link>

                        <div className="pt-2">
                          <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Gestion
                          </p>

                          <Link
                            href="/dashboard/clients"
                            className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Users className="h-5 w-5 mr-3 text-gray-500" />
                            <span className="font-medium">Clients</span>
                          </Link>
                          <Link
                            href="/dashboard/payments"
                            className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <CreditCard className="h-5 w-5 mr-3 text-gray-500" />
                            <span className="font-medium">Paiements</span>
                          </Link>
                          <Link
                            href="/dashboard/calendar"
                            className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Calendar className="h-5 w-5 mr-3 text-gray-500" />
                            <span className="font-medium">Calendrier</span>
                          </Link>
                          {isStandard && (
                            <Link
                              href="/dashboard/historic"
                              className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition-colors"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <History className="h-5 w-5 mr-3 text-gray-500" />
                              <span className="font-medium">Historique</span>
                            </Link>
                          )}
                        </div>

                        <div className="pt-2">
                          <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Rapports
                          </p>
                          <Link
                            href="/dashboard/reports"
                            className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <TrendingUp className="h-5 w-5 mr-3 text-gray-500" />
                            <span className="font-medium">Analyse</span>
                          </Link>
                          <Link
                            href="/dashboard/factures"
                            className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <ReceiptCent className="h-5 w-5 mr-3 text-gray-500" />
                            <span className="font-medium">Factures</span>
                          </Link>
                        </div>
                      </>
                    ) : (
                      // Navigation for Coaches (only Clients link)
                      <>
                        <Link
                          href="/dashboard/clients"
                          className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Users className="h-5 w-5 mr-3 text-gray-500" />
                          <span className="font-medium">Clients</span>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </nav>
            </div>

            <div className="mt-auto p-4 border-t border-gray-200">
              {subscriptionWarning?.daysRemaining !== 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-800">
                    E-Gym Pro
                  </h3>
                  <p className="text-xs text-blue-600 mt-1">Version 1.0</p>
                  <a
                    href="#"
                    className="text-xs text-blue-700 hover:text-blue-900 mt-2 inline-block font-medium"
                  >
                    Prochaine mise à jour : 15/08/2025
                  </a>
                </div>
              )}
            </div>
          </aside>

          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            {isMenuOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                onClick={() => setIsMenuOpen(false)}
              ></div>
            )}

            {subscriptionWarning?.daysRemaining === 0 ? (
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <p className="text-xl font-semibold text-gray-800">
                    Vous devez renouveler votre abonnement. Contactez-moi sur
                    WhatsApp au numéro suivant : +225 05 84 18 53 67
                  </p>
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
