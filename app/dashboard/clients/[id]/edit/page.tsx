"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { User, ArrowLeft, Save, AlertCircle } from "lucide-react";

export default function ClientEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const clientId = params?.id;
  const [client, setClient] = useState({
    name: "",
    email: "",
    phone: "",
    registrationDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Récupérer les données du client au montage
  useEffect(() => {
    const fetchClient = async () => {
      if (status === "loading") return;
      if (!session) {
        router.push("/");
        return;
      }

      if (!clientId || typeof clientId !== "string") {
        setError("ID du client invalide ou manquant");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/clients/${clientId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `Échec de la récupération des données du client (Statut : ${response.status})`
          );
        }

        const data = await response.json();
        setClient({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          registrationDate: data.registrationDate
            ? new Date(data.registrationDate).toISOString().split("T")[0]
            : "",
        });
      } catch (err) {
        console.error("Erreur de récupération :", err);
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

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: client.name,
          email: client.email,
          phone: client.phone,
          registrationDate: client.registrationDate || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Échec de la mise à jour du client (Statut : ${response.status})`
        );
      }

      const updatedClient = await response.json();
      setSuccess("Client mis à jour avec succès");
      setTimeout(() => router.push(`/dashboard/clients/${clientId}`), 2000); // Redirection après 2 secondes
    } catch (err) {
      console.error("Erreur de mise à jour :", err);
      setError(
        err.message ||
          "Une erreur s'est produite lors de la mise à jour des données du client"
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
        <div className="flex items-center gap-2 p-2 sm:p-3 bg-red-50 text-red-700 rounded-lg text-xs sm:text-sm">
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
            href={`/dashboard/clients/${clientId}`}
            className="mr-2 sm:mr-3 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center text-gray-800">
              <User className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6 mr-2 text-blue-600" />
              Modifier le client
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
              Mettre à jour les détails du client
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire de modification */}
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md">
        {success && (
          <div className="mb-4 p-2 sm:p-3 bg-green-50 text-green-700 rounded-lg text-xs sm:text-sm">
            <span>{success}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              type="text"
              value={client.name}
              onChange={(e) => setClient({ ...client, name: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={client.email}
              onChange={(e) => setClient({ ...client, email: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={client.phone}
              onChange={(e) => setClient({ ...client, phone: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
              Date d'inscription
            </label>
            <input
              type="date"
              value={client.registrationDate}
              onChange={(e) =>
                setClient({ ...client, registrationDate: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-xs sm:text-sm md:text-base"
          >
            <Save className="h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6" />
            Enregistrer les modifications
          </button>
        </form>
      </div>
    </div>
  );
}
