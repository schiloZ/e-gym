"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { User, ArrowLeft, Save, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

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
    height: "",
    weight: "",
    age: "",
    medicalConditions: "",
    allergies: "",
    injuries: "",
    medications: "",
    bloodPressure: "",
    targetWeight: "",
    fitnessGoal: "",
    targetBodyFat: "",
    goalMilestone: "",
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
          height: data.height ? String(data.height) : "",
          weight: data.weight ? String(data.weight) : "",
          age: data.age ? String(data.age) : "",
          medicalConditions: data.medicalConditions || "",
          allergies: data.allergies || "",
          injuries: data.injuries || "",
          medications: data.medications || "",
          bloodPressure: data.bloodPressure || "",
          targetWeight: data.targetWeight ? String(data.targetWeight) : "",
          fitnessGoal: data.fitnessGoal || "",
          targetBodyFat: data.targetBodyFat ? String(data.targetBodyFat) : "",
          goalMilestone: data.goalMilestone
            ? new Date(data.goalMilestone).toISOString().split("T")[0]
            : "",
        });
      } catch (err: any) {
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

    // Client-side validation
    if (!client.name) {
      toast.error("Le nom est requis");
      return;
    }
    if (!client.email) {
      toast.error("L'email est requis");
      return;
    }
    if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) {
      toast.error("Format d'email invalide");
      return;
    }
    if (client.phone && !/^\+?[1-9]\d{9,14}$/.test(client.phone)) {
      toast.error("Format de numéro de téléphone invalide (ex. +1234567890)");
      return;
    }
    if (
      client.height &&
      (Number(client.height) <= 0 || Number(client.height) > 300)
    ) {
      toast.error("La taille doit être entre 0 et 300 cm");
      return;
    }
    if (
      client.weight &&
      (Number(client.weight) <= 0 || Number(client.weight) > 500)
    ) {
      toast.error("Le poids doit être entre 0 et 500 kg");
      return;
    }
    if (client.age && (Number(client.age) < 0 || Number(client.age) > 150)) {
      toast.error("L'âge doit être entre 0 et 150 ans");
      return;
    }
    if (
      client.bloodPressure &&
      !/^\d{2,3}\/\d{2,3}$/.test(client.bloodPressure)
    ) {
      toast.error(
        "La pression artérielle doit être au format 'systolique/diastolique' (ex. 120/80)"
      );
      return;
    }
    if (
      client.targetWeight &&
      (Number(client.targetWeight) <= 0 || Number(client.targetWeight) > 500)
    ) {
      toast.error("Le poids cible doit être entre 0 et 500 kg");
      return;
    }
    if (
      client.targetBodyFat &&
      (Number(client.targetBodyFat) < 0 || Number(client.targetBodyFat) > 100)
    ) {
      toast.error(
        "Le pourcentage de graisse corporelle cible doit être entre 0 et 100"
      );
      return;
    }
    if (
      client.fitnessGoal &&
      !["weight loss", "muscle gain", "endurance", "general fitness"].includes(
        client.fitnessGoal.toLowerCase()
      )
    ) {
      toast.error(
        "L'objectif physique doit être l'un des suivants : 'weight loss', 'muscle gain', 'endurance', 'general fitness'"
      );
      return;
    }

    // Prepare the data to send (convert numeric fields to numbers, dates to Date objects)
    const dataToSend = {
      name: client.name,
      email: client.email,
      phone: client.phone,
      registrationDate: client.registrationDate || undefined,
      height: client.height ? Number(client.height) : undefined,
      weight: client.weight ? Number(client.weight) : undefined,
      age: client.age ? Number(client.age) : undefined,
      medicalConditions: client.medicalConditions || undefined,
      allergies: client.allergies || undefined,
      injuries: client.injuries || undefined,
      medications: client.medications || undefined,
      bloodPressure: client.bloodPressure || undefined,
      targetWeight: client.targetWeight
        ? Number(client.targetWeight)
        : undefined,
      fitnessGoal: client.fitnessGoal || undefined,
      targetBodyFat: client.targetBodyFat
        ? Number(client.targetBodyFat)
        : undefined,
      goalMilestone: client.goalMilestone || undefined,
    };

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Échec de la mise à jour du client (Statut : ${response.status})`
        );
      }

      setSuccess("Client mis à jour avec succès");
      setTimeout(() => router.push(`/dashboard/clients/${clientId}`), 2000); // Redirection après 2 secondes
    } catch (err: any) {
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
              Mettre à jour les détails du client, les informations médicales et
              les objectifs
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
          {/* General Information Section */}
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              Informations Générales
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={client.name}
                  onChange={(e) =>
                    setClient({ ...client, name: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={client.email}
                  onChange={(e) =>
                    setClient({ ...client, email: e.target.value })
                  }
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
                  onChange={(e) =>
                    setClient({ ...client, phone: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                  Date d&apos;inscription
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
            </div>
          </div>

          {/* Medical Information Section */}
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              Informations Médicales (Facultatif)
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
              <div>
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                  Taille (cm)
                </label>
                <input
                  type="number"
                  value={client.height}
                  onChange={(e) =>
                    setClient({ ...client, height: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                  Poids (kg)
                </label>
                <input
                  type="number"
                  value={client.weight}
                  onChange={(e) =>
                    setClient({ ...client, weight: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                  Âge (années)
                </label>
                <input
                  type="number"
                  value={client.age}
                  onChange={(e) =>
                    setClient({ ...client, age: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                  Pression artérielle (systolique/diastolique)
                </label>
                <input
                  type="text"
                  value={client.bloodPressure}
                  onChange={(e) =>
                    setClient({ ...client, bloodPressure: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                  placeholder="120/80"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                  Conditions médicales
                </label>
                <input
                  type="text"
                  value={client.medicalConditions}
                  onChange={(e) =>
                    setClient({ ...client, medicalConditions: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                  placeholder="Diabète, Asthme"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                  Allergies
                </label>
                <input
                  type="text"
                  value={client.allergies}
                  onChange={(e) =>
                    setClient({ ...client, allergies: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                  placeholder="Arachides, Poussière"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                  Blessures
                </label>
                <input
                  type="text"
                  value={client.injuries}
                  onChange={(e) =>
                    setClient({ ...client, injuries: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                  placeholder="Chirurgie du genou 2023"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                  Médicaments
                </label>
                <input
                  type="text"
                  value={client.medications}
                  onChange={(e) =>
                    setClient({ ...client, medications: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                  placeholder="Metformine"
                />
              </div>
            </div>
          </div>

          {/* Body Goals Section */}
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              Objectifs Physiques (Facultatif)
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
              <div>
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                  Poids cible (kg)
                </label>
                <input
                  type="number"
                  value={client.targetWeight}
                  onChange={(e) =>
                    setClient({ ...client, targetWeight: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                  Pourcentage de graisse corporelle cible (%)
                </label>
                <input
                  type="number"
                  value={client.targetBodyFat}
                  onChange={(e) =>
                    setClient({ ...client, targetBodyFat: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                  Objectif physique
                </label>
                <select
                  value={client.fitnessGoal}
                  onChange={(e) =>
                    setClient({ ...client, fitnessGoal: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                >
                  <option value="">Sélectionner un objectif</option>
                  <option value="weight loss">Perte de poids</option>
                  <option value="muscle gain">Gain musculaire</option>
                  <option value="endurance">Endurance</option>
                  <option value="general fitness">
                    Condition physique générale
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1">
                  Date de l&apos;objectif
                </label>
                <input
                  type="date"
                  value={client.goalMilestone}
                  onChange={(e) =>
                    setClient({ ...client, goalMilestone: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
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
