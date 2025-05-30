"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
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
  Settings,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export default function AdminDashboardLayout({
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, []);

  // Handle authorization redirect
  useEffect(() => {
    if (!session && status === "unauthenticated") {
      router.push("/");
    } else if (
      session &&
      !["superadmin", true].includes(
        (session?.user as any)?.role || (session?.user as any)?.isSuperAdmin
      )
    ) {
      router.push("/");
    }
  }, [session, status, router]);

  // Handle logout with deferred navigation and loading state
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    setIsProfileOpen(false);
    try {
      await signOut({ redirect: false });
      toast.success("Déconnection réussie !", {
        duration: 3000,
      });
      setTimeout(() => router.push("/"), 0);
    } catch (error: any) {
      toast.error("Erreur lors de la déconnexion", {
        duration: 4000,
      });
      console.error(error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);
  // Handle loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Top Navigation Bar */}
        <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-30">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              {/* Logo and Toggle */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:hidden text-gray-600 hover:text-blue-600 focus:outline-none"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <button
                  onClick={() => router.push("/dashboardAdmin")}
                  className="flex items-center"
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-600 text-white p-2 rounded-lg">
                      <Dumbbell className="h-6 w-6" />
                    </div>
                    <span className="text-xl font-bold text-blue-600">
                      E-Gym Admin
                    </span>
                  </div>
                </button>
              </div>

              {/* Right Section - Notifications & Profile */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsNotificationOpen(!isNotificationOpen);
                      setIsProfileOpen(false);
                    }}
                    className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 focus:outline-none relative"
                    disabled={isLoggingOut}
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {notifications.filter(
                        (n: { isRead: boolean }) => !n.isRead
                      ).length || 0}
                    </span>
                  </button>

                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">
                          Notifications
                        </h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-3 text-center text-gray-500">
                            No new notifications
                          </div>
                        ) : (
                          notifications.map((notification: any) => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 hover:bg-gray-50 border-l-4 ${
                                notification.type === "CLIENT_REGISTERED"
                                  ? "border-blue-500"
                                  : "border-green-500"
                              }`}
                            >
                              <p className="text-sm font-medium text-gray-800">
                                {notification.type === "CLIENT_REGISTERED"
                                  ? "New client registered"
                                  : "Payment received"}
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
                        <div className="px-4 py-3 text-center border-t border-gray-100">
                          <button
                            onClick={() =>
                              router.push("/dashboard/admin/notifications")
                            }
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View all notifications
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsProfileOpen(!isProfileOpen);
                      setIsNotificationOpen(false);
                    }}
                    className="flex items-center text-gray-600 hover:text-blue-600 focus:outline-none"
                    disabled={isLoggingOut}
                  >
                    <div className="bg-blue-100 text-blue-600 rounded-full p-1">
                      <User className="h-5 w-5" />
                    </div>
                    <span className="hidden md:block ml-2 font-medium">
                      {session?.user?.email || "Admin User"}
                    </span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-50">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push("/dashboard/admin/profile");
                        }}
                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 w-full text-left"
                      >
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          <span>My Profile</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push("/dashboard/admin/settings");
                        }}
                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 w-full text-left"
                      >
                        <div className="flex items-center">
                          <Settings className="h-4 w-4 mr-2" />
                          <span>Settings</span>
                        </div>
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center"
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            <span>Logging out...</span>
                          </>
                        ) : (
                          <>
                            <LogOut className="h-4 w-4 mr-2" />
                            <span>Logout</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex flex-1">
          {/* Sidebar - Hidden on Mobile */}
          <aside
            className={`lg:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm ${
              isMenuOpen ? "fixed inset-0 z-40 pt-16" : "hidden"
            } lg:relative lg:pt-0`}
          >
            <div className="p-4 lg:p-6">
              <div className="lg:hidden flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-800">Admin Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <nav className="space-y-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/dashboardAdmin");
                  }}
                  className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition-colors w-full text-left"
                >
                  <LayoutDashboard className="h-5 w-5 mr-3 text-gray-500" />
                  <span className="font-medium">Admin Dashboard</span>
                </button>

                <div className="pt-2">
                  <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Management
                  </p>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push("/dashboardAdmin/users");
                    }}
                    className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition-colors w-full text-left"
                  >
                    <Users className="h-5 w-5 mr-3 text-gray-500" />
                    <span className="font-medium">Manage Users</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push("/dashboardAdmin/register");
                    }}
                    className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition-colors w-full text-left"
                  >
                    <Users className="h-5 w-5 mr-3 text-gray-500" />
                    <span className="font-medium">Register Client</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push("/dashboardAdmin/subscriptions");
                    }}
                    className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition-colors w-full text-left"
                  >
                    <CreditCard className="h-5 w-5 mr-3 text-gray-500" />
                    <span className="font-medium">Subscriptions</span>
                  </button>
                </div>

                <div className="pt-2">
                  <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Reports
                  </p>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push("/dashboard/admin/reports");
                    }}
                    className="flex items-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 rounded-lg transition-colors w-full text-left"
                  >
                    <TrendingUp className="h-5 w-5 mr-3 text-gray-500" />
                    <span className="font-medium">Analytics</span>
                  </button>
                </div>
              </nav>
            </div>

            {/* App Info */}
            <div className="mt-auto p-4 border-t border-gray-200">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800">
                  E-Gym Pro
                </h3>
                <p className="text-xs text-blue-600 mt-1">Version 2.5.0</p>
                <a
                  href="#"
                  className="text-xs text-blue-700 hover:text-blue-900 mt-2 inline-block font-medium"
                >
                  Check for updates
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            {isMenuOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                onClick={() => setIsMenuOpen(false)}
              ></div>
            )}

            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
