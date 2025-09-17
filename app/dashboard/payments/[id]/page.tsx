"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  ArrowLeft,
  AlertCircle,
  Download,
  Receipt,
} from "lucide-react";
import jsPDF from "jspdf";
import toast from "react-hot-toast";

export default function PaymentDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const paymentId = params.id;
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{
    name: string | null;
    location: string | null;
  } | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

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
          console.log("Réponse de l'API company/me :", data);
          setCompanyInfo({
            ...data,
            name: data.name || "Votre Entreprise",
            location: data.location || "Abidjan, Côte d'Ivoire",
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

  const generateReceipt = async () => {
    if (!payment || !companyInfo) return;

    setGeneratingPdf(true);
    try {
      const doc = new jsPDF();

      // Add company header with colors
      doc.setFillColor(34, 139, 34); // Green background
      doc.rect(0, 0, 220, 30, "F");

      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text("REÇU DE PAIEMENT", 105, 18, { align: "center" });

      doc.setFontSize(12);
      doc.text(`${companyInfo.name} - Paiements Sécurisés`, 105, 25, {
        align: "center",
      });

      // Add receipt details box
      doc.setFillColor(240, 240, 240); // Light gray background
      doc.rect(15, 40, 180, 20, "F");

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Détails du Reçu", 105, 50, { align: "center" });

      // Add receipt ID and date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `N° de reçu: PAY-${typeof paymentId === "string" ? paymentId.slice(0, 8).toUpperCase() : "INCONNU"}`,
        20,
        65
      );
      doc.text(
        `Date d'émission: ${new Date().toLocaleDateString("fr-FR")}`,
        150,
        65
      );

      // Add separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 70, 195, 70);

      // Company information
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("De:", 20, 85);
      doc.setFont("helvetica", "normal");
      doc.text(companyInfo.name || "Votre Entreprise", 20, 92);
      doc.text(companyInfo.location || "Abidjan, Côte d'Ivoire", 20, 106);

      // Client information
      doc.setFont("helvetica", "bold");
      doc.text("Pour:", 120, 85);
      doc.setFont("helvetica", "normal");
      doc.text(payment.client.name, 120, 92);
      doc.text("Client", 120, 99);

      // Add another separator line
      doc.line(15, 130, 195, 130);

      // Payment details header
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 139, 34); // Green text
      doc.text("Détails de la Transaction", 20, 145);

      // Payment details
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      const details = [
        {
          label: "Description",
          value: `Abonnement ${(() => {
            const translations: Record<string, string> = {
              Daily: "Quotidien",
              Weekly: "Hebdomadaire",
              Monthly: "Mensuel",
              Quarterly: "Trimestriel",
              Yearly: "Annuel",
            };
            return translations[payment.subscription] || payment.subscription;
          })()}`,
        },
        {
          label: "Montant",
          value: `${payment.amount} FCFA`,
        },
        {
          label: "Méthode de paiement",
          value: `${(() => {
            const translations: Record<string, string> = {
              Cash: "Espèces",
              Card: "Carte de crédit",
              "Bank Transfer": "Virement bancaire",
              "Mobile Money":
                "Paiement mobile, MTN Money, Orange Money, Wave, etc.",
            };
            return translations[payment.method] || payment.method;
          })()}`,
        },
        {
          label: "Statut",
          value: payment.paymentStatus === "Paid" ? "Payé" : "En attente",
        },
        {
          label: "Date de paiement",
          value: payment.paymentDate
            ? new Date(payment.paymentDate).toLocaleDateString("fr-FR")
            : "N/A",
        },
        {
          label: "Période",
          value: `${new Date(payment.startDate).toLocaleDateString("fr-FR")} - ${new Date(payment.endDate).toLocaleDateString("fr-FR")}`,
        },
      ];

      details.forEach((detail, index) => {
        const yPos = 155 + index * 8;
        doc.setFont("helvetica", "bold");
        doc.text(`${detail.label}:`, 20, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(detail.value, 70, yPos);
      });

      // Add total amount with emphasis
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 139, 34);
      doc.text("Montant Total:", 20, 215);
      doc.text(`${payment.amount} FCFA`, 70, 215);

      // Add signature area
      doc.setDrawColor(0, 0, 0);
      doc.line(120, 230, 180, 230);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Signature du client", 150, 235, { align: "center" });

      // Add thank you message
      doc.setFontSize(11);
      doc.setTextColor(34, 139, 34);
      doc.text("Merci pour votre confiance!", 105, 250, { align: "center" });

      // Add footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "Ce document fait office de reçu officiel. Conservez-le pour vos archives.",
        105,
        270,
        { align: "center" }
      );
      doc.text(
        "Pour toute question, contactez-nous à support@entreprise.com",
        105,
        275,
        { align: "center" }
      );

      // Save the PDF
      doc.save(
        `recu-paiement-${payment.client.name}-${typeof paymentId === "string" ? paymentId.slice(0, 8) : "INCONNU"}.pdf`
      );
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      setError("Une erreur s'est produite lors de la génération du reçu");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (status === "loading" || loading || loadingCompany) {
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

        {/* Bouton de téléchargement du reçu */}
        <button
          onClick={generateReceipt}
          disabled={generatingPdf}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generatingPdf ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Génération...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Télécharger le reçu</span>
            </>
          )}
        </button>
      </div>

      {/* Détails du paiement */}
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">
            Informations sur le paiement
          </h2>
          <Receipt className="h-6 w-6 text-green-600" />
        </div>
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
                  Card: "Carte de crédit",
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
