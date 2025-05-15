"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AddClientForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    userId: userId,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!formData.name) {
      toast.error("Le nom est requis");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error);
        throw new Error(errorData.error || "Échec de l'ajout du client");
      }

      const data = await response.json();
      toast.success("Client enregistré avec succès !", {
        duration: 3000,
      });
      router.push(`/dashboard/clients/${data.client.id}`);
    } catch (err: any) {
      console.error("Erreur de création du client :", err);
      toast.error("Erreur lors de l'ajout du client");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8 bg-white rounded-xl shadow-md">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex items-center mb-4 sm:mb-0">
          <UserPlus className="h-5 sm:h-6 md:h-7 w-5 sm:w-6 md:w-7 mr-2 text-blue-500" />
          Enregistrer un nouveau client
        </h1>
        <Link
          href="/dashboard/clients"
          className="text-gray-600 hover:text-blue-600 flex items-center text-xs sm:text-sm md:text-base"
        >
          <ArrowLeft className="h-3 sm:h-4 md:h-5 w-3 sm:w-4 md:w-5 mr-1" />
          Retour aux clients
        </Link>
      </div>

      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-xs sm:text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="name"
              className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
            >
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
              placeholder="Jean Dupont"
              required
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
            >
              Numéro de téléphone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
              placeholder="+237 6XX XXX XXX"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
            >
              Adresse email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
              placeholder="jean@example.com"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-100">
          <Link
            href="/dashboard/clients"
            className="px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-xs sm:text-sm md:text-base w-full sm:w-auto"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-white font-medium flex items-center ${
              isSubmitting
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } transition shadow-md text-xs sm:text-sm md:text-base w-full sm:w-auto`}
          >
            {isSubmitting ? (
              "Traitement en cours..."
            ) : (
              <>
                <UserPlus className="h-3 sm:h-4 md:h-5 w-3 sm:w-4 md:w-5 mr-2" />
                Enregistrer le client
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="text-xs sm:text-sm md:text-base font-medium text-blue-800 mb-2">
          Conseils rapides pour l'enregistrement des clients
        </h3>
        <ul className="text-xs sm:text-sm md:text-base text-blue-600 space-y-1 list-disc list-inside">
          <li>Le nom est le seul champ requis</li>
          <li>Le numéro de téléphone aide pour les notifications SMS</li>
          <li>
            L'email est facultatif mais utile pour la communication digitale
          </li>
          <li>
            Vous pouvez ajouter plus de détails plus tard dans le profil du
            client
          </li>
        </ul>
      </div>
    </div>
  );
}
