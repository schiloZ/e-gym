"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, ArrowLeft, Calendar, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import Select from "react-select";

export default function NewPaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<any>([]);
  const [formData, setFormData] = useState({
    clientId: "",
    amount: "",
    subscription: "Monthly",
    method: "Cash",
    status: "Pending",
    startDate: new Date().toISOString().split("T")[0],
    endDate: calculateEndDate(new Date().toISOString().split("T")[0]),
    nextPaymentDate: calculateNextPaymentDate(
      calculateEndDate(new Date().toISOString().split("T")[0])
    ),
    paymentDate: "",
    paymentStatus: "Paid",
  });
  // Helper functions to calculate dates
  function calculateEndDate(startDate: string): string {
    const date = new Date(startDate);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
  }

  function calculateNextPaymentDate(endDate: string): string {
    const date = new Date(endDate);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0];
  }
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingClients, setLoadingClients] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      if (status === "loading") return;
      if (!session) {
        router.push("/");
        return;
      }

      try {
        const response = await fetch("/api/clients");
        const data = await response.json();
        setClients(data);
      } catch (err: any) {
        setError(
          err.message || "Échec du chargement des clients. Veuillez réessayer."
        );
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, [session, status, router]);

  const handleChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClientSelect = (selectedOption: any) => {
    setFormData((prev) => ({
      ...prev,
      clientId: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!formData.clientId || !formData.amount) {
      toast.error(
        "S'il vous plaît, sélectionnez un client et saisissez un montant."
      );
      setError(
        "S'il vous plaît, sélectionnez un client et saisissez un montant."
      );
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: formData.clientId,
          amount: parseInt(formData.amount),
          subscription: formData.subscription,
          method: formData.method,
          status: formData.status,
          startDate: formData.startDate
            ? new Date(formData.startDate).toISOString()
            : null,
          endDate: formData.endDate
            ? new Date(formData.endDate).toISOString()
            : null,
          nextPaymentDate: formData.nextPaymentDate
            ? new Date(formData.nextPaymentDate).toISOString()
            : null,
          paymentDate: formData.paymentDate
            ? new Date(formData.paymentDate).toISOString()
            : null,
          paymentStatus: formData.paymentStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Échec de l'enregistrement du paiement");
        throw new Error(
          result.error || "Échec de l'enregistrement du paiement"
        );
      }

      toast.success("Paiement enregistré avec succès !");
      setTimeout(() => router.push("/dashboard/payments"), 1500);
    } catch (err: any) {
      setError(
        err.message ||
          "Une erreur s'est produite lors de l'enregistrement du paiement."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const clientOptions = clients.map(
    (client: { id: string; name: string; email: string }) => ({
      value: client.id,
      label: `${client.name} (${client.email})`,
    })
  );

  if (status === "loading" || loadingClients) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        Chargement...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
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
                Enregistrer un nouveau paiement
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
                Ajouter un nouveau paiement pour un client
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-2 sm:p-3 bg-red-50 text-red-700 rounded-lg text-xs sm:text-sm md:text-base">
                <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-2 sm:p-3 bg-green-50 text-green-700 rounded-lg text-xs sm:text-sm md:text-base">
                <CreditCard className="h-4 sm:h-5 w-4 sm:w-5" />
                <span>{success}</span>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                Client
              </label>
              <Select
                options={clientOptions}
                onChange={handleClientSelect}
                value={clientOptions.find(
                  (option: any) => option.value === formData.clientId
                )}
                placeholder="Rechercher un client par nom..."
                isClearable
                className="text-xs sm:text-sm md:text-base"
                classNamePrefix="select"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#e5e7eb",
                    borderRadius: "0.5rem",
                    padding: "0.25rem",
                    "&:hover": {
                      borderColor: "#10b981",
                    },
                    boxShadow: "none",
                    "&:focus-within": {
                      borderColor: "#10b981",
                      ring: "2px",
                      ringColor: "#10b981",
                    },
                  }),
                  input: (base) => ({
                    ...base,
                    padding: "0.25rem",
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: "0.5rem",
                    marginTop: "0.25rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }),
                  option: (base, { isFocused, isSelected }) => ({
                    ...base,
                    backgroundColor: isSelected
                      ? "#10b981"
                      : isFocused
                        ? "#f0fdf4"
                        : "white",
                    color: isSelected ? "white" : "#1f2937",
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "#f0fdf4",
                    },
                  }),
                }}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                Montant (FCFA)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 sm:h-5 w-4 sm:w-5 text-gray-400">
                  XOF
                </span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
                  placeholder="Saisissez le montant"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                Abonnement
              </label>
              <select
                name="subscription"
                value={formData.subscription}
                onChange={handleChange}
                className="w-full p-2 sm:p-2.5 md:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
              >
                <option value="Daily">Quotidien</option>
                <option value="Weekly">Hebdomadaire</option>
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
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="w-full p-2 sm:p-2.5 md:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
              >
                <option value="Cash">Espèces</option>
                <option value="Mobile Money">
                  Paiement mobile: MTN, Orange Money, Wave
                </option>
                <option value="Credit Card">Carte de crédit</option>
                <option value="Bank Transfer">Virement bancaire</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                Statut du paiement
              </label>
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                className="w-full p-2 sm:p-2.5 md:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
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
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                Prochaine date de paiement
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                <input
                  type="date"
                  name="nextPaymentDate"
                  value={formData.nextPaymentDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-xs sm:text-sm md:text-base"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full sm:w-auto bg-green-600 text-white py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-md text-xs sm:text-sm md:text-base ${
                  submitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <CreditCard className="h-4 sm:h-5 w-4 sm:w-5" />
                {submitting ? "Enregistrement..." : "Enregistrer le paiement"}
              </button>
              <Link
                href="/dashboard/payments"
                className="w-full sm:w-auto bg-gray-200 text-gray-700 py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-300 transition shadow-md text-xs sm:text-sm md:text-base text-center"
              >
                Annuler
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
