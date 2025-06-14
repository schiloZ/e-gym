"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import Image from "next/image";

export default function AddClientForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "", // Email is optional
    registrationDate: "", // New field for Date d'inscription
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<{
    subscriptionType: string | null;
  } | null>(null);

  // Fetch company info
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch("/api/company/me");
        if (!response.ok) throw new Error("Failed to fetch company details");
        const data = await response.json();
        setCompanyInfo({ ...data });
      } catch (err: unknown) {
        toast.error((err as Error).message, { duration: 4000 });
      }
    };
    fetchCompanyInfo();
  }, []);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Set userId from session
  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        userId: (session.user as any).id,
      }));
    }
  }, [session]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Client-side validation
    if (!formData.name) {
      toast.error("Le nom est requis");
      setIsSubmitting(false);
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Format d'email invalide");
      setIsSubmitting(false);
      return;
    }

    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone)) {
      toast.error("Format de numéro de téléphone invalide");
      setIsSubmitting(false);
      return;
    }

    if (
      formData.height &&
      (Number(formData.height) <= 0 || Number(formData.height) > 300)
    ) {
      toast.error("La taille doit être entre 0 et 300");
      setIsSubmitting(false);
      return;
    }

    if (
      formData.weight &&
      (Number(formData.weight) <= 0 || Number(formData.weight) > 500)
    ) {
      toast.error("Le poids doit être entre 0 et 500 kg");
      setIsSubmitting(false);
      return;
    }

    if (
      formData.age &&
      (Number(formData.age) < 0 || Number(formData.age) > 150)
    ) {
      toast.error("L'âge doit être entre 0 et 150 ans");
      setIsSubmitting(false);
      return;
    }

    if (
      formData.bloodPressure &&
      !/^\d{2,3}\/\d{2,3}$/.test(formData.bloodPressure)
    ) {
      toast.error(
        "La pression artérielle doit être au format 'systolique/diastolique' (ex. 120/80)"
      );
      setIsSubmitting(false);
      return;
    }

    if (
      formData.targetWeight &&
      (Number(formData.targetWeight) <= 0 ||
        Number(formData.targetWeight) > 500)
    ) {
      toast.error("Le poids cible doit être entre 0 et 500 kg");
      setIsSubmitting(false);
      return;
    }

    if (
      formData.targetBodyFat &&
      (Number(formData.targetBodyFat) < 0 ||
        Number(formData.targetBodyFat) > 100)
    ) {
      toast.error(
        "Le pourcentage de graisse corporelle cible doit être entre 0 et 100"
      );
      setIsSubmitting(false);
      return;
    }

    if (
      formData.fitnessGoal &&
      !["weight loss", "muscle gain", "endurance", "general fitness"].includes(
        formData.fitnessGoal.toLowerCase()
      )
    ) {
      toast.error(
        "L'objectif physique doit être l'un des suivants : 'weight loss', 'muscle gain', 'endurance', 'general fitness'"
      );
      setIsSubmitting(false);
      return;
    }

    // Validate registrationDate
    if (
      formData.registrationDate &&
      isNaN(new Date(formData.registrationDate).getTime())
    ) {
      toast.error("La date d'inscription est invalide");
      setIsSubmitting(false);
      return;
    }

    // Prepare FormData for submission
    const dataToSend = new FormData();
    dataToSend.append("name", formData.name);
    if (formData.phone) dataToSend.append("phone", formData.phone);
    if (formData.email) dataToSend.append("email", formData.email);
    if (session?.user) dataToSend.append("userId", (session.user as any).id);
    if (formData.height) dataToSend.append("height", formData.height);
    if (formData.weight) dataToSend.append("weight", formData.weight);
    if (formData.age) dataToSend.append("age", formData.age);
    if (formData.medicalConditions)
      dataToSend.append("medicalConditions", formData.medicalConditions);
    if (formData.allergies) dataToSend.append("allergies", formData.allergies);
    if (formData.injuries) dataToSend.append("injuries", formData.injuries);
    if (formData.medications)
      dataToSend.append("medications", formData.medications);
    if (formData.bloodPressure)
      dataToSend.append("bloodPressure", formData.bloodPressure);
    if (formData.targetWeight)
      dataToSend.append("targetWeight", formData.targetWeight);
    if (formData.fitnessGoal)
      dataToSend.append("fitnessGoal", formData.fitnessGoal);
    if (formData.targetBodyFat)
      dataToSend.append("targetBodyFat", formData.targetBodyFat);
    if (formData.goalMilestone)
      dataToSend.append(
        "goalMilestone",
        new Date(formData.goalMilestone).toISOString().split("T")[0]
      );
    if (formData.registrationDate)
      dataToSend.append(
        "registrationDate",
        new Date(formData.registrationDate).toISOString().split("T")[0]
      );
    if (imageFile) dataToSend.append("image", imageFile);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        body: dataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Échec de l'ajout du client");
        throw new Error(errorData.error || "Échec de l'ajout du client");
      }

      const data = await response.json();
      toast.success("Client enregistré avec succès !", { duration: 3000 });
      router.push(`/dashboard/clients/${data.client.id}`);
    } catch (err: any) {
      console.error("Erreur de création du client :", err);
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStandardPlan = companyInfo?.subscriptionType !== "free";

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
        {/* General Information Section */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            Informations Générales
          </h2>
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
                Adresse email (Facultatif)
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

            <div>
              <label
                htmlFor="registrationDate"
                className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
              >
                Date d&apos;inscription (Facultatif)
              </label>
              <input
                type="date"
                id="registrationDate"
                name="registrationDate"
                value={formData.registrationDate}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
              />
            </div>

            {isStandardPlan && (
              <div className="md:col-span-2">
                <label
                  htmlFor="image"
                  className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
                >
                  Photo du client (Facultatif)
                </label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm md:text-base"
                  disabled={isSubmitting}
                />
                {previewImage && (
                  <div className="mt-2">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">
                      Aperçu de l&apos;image :
                    </p>
                    <Image
                      src={previewImage}
                      alt="Aperçu de la photo du client"
                      width={100}
                      height={100}
                      className="rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Medical Information Section */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            Informations Médicales (Facultatif)
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="height"
                className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
              >
                Taille (cm)
              </label>
              <input
                type="number"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                placeholder="175.5"
                step="0.1"
              />
            </div>

            <div>
              <label
                htmlFor="weight"
                className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
              >
                Poids (kg)
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                placeholder="70.2"
                step="0.1"
              />
            </div>

            <div>
              <label
                htmlFor="age"
                className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
              >
                Âge (années)
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                placeholder="30"
              />
            </div>

            <div>
              <label
                htmlFor="bloodPressure"
                className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
              >
                Pression artérielle (systolique/diastolique)
              </label>
              <input
                type="text"
                id="bloodPressure"
                name="bloodPressure"
                value={formData.bloodPressure}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                placeholder="120/80"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="medicalConditions"
                className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
              >
                Conditions médicales
              </label>
              <input
                type="text"
                id="medicalConditions"
                name="medicalConditions"
                value={formData.medicalConditions}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                placeholder="Diabète, Asthme"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="allergies"
                className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
              >
                Allergies
              </label>
              <input
                type="text"
                id="allergies"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                placeholder="Arachides, Poussière"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="injuries"
                className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
              >
                Blessures
              </label>
              <input
                type="text"
                id="injuries"
                name="injuries"
                value={formData.injuries}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                placeholder="Chirurgie du genou 2023"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="medications"
                className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
              >
                Médicaments
              </label>
              <input
                type="text"
                id="medications"
                name="medications"
                value={formData.medications}
                onChange={handleChange}
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
              <label
                htmlFor="targetWeight"
                className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
              >
                Poids cible (kg)
              </label>
              <input
                type="number"
                id="targetWeight"
                name="targetWeight"
                value={formData.targetWeight}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                placeholder="65.0"
                step="0.1"
              />
            </div>

            <div>
              <label
                htmlFor="targetBodyFat"
                className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
              >
                Pourcentage de graisse corporelle cible (%)
              </label>
              <input
                type="number"
                id="targetBodyFat"
                name="targetBodyFat"
                value={formData.targetBodyFat}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
                placeholder="15.0"
                step="0.1"
              />
            </div>

            <div>
              <label
                htmlFor="fitnessGoal"
                className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
              >
                Objectif physique
              </label>
              <select
                id="fitnessGoal"
                name="fitnessGoal"
                value={formData.fitnessGoal}
                onChange={handleChange}
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
              <label
                htmlFor="goalMilestone"
                className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1"
              >
                Date d&apos;objectif
              </label>
              <input
                type="date"
                id="goalMilestone"
                name="goalMilestone"
                value={formData.goalMilestone}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-xs sm:text-sm md:text-base"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
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
          Conseils rapides pour l&apos;enregistrement des clients
        </h3>
        <ul className="text-xs sm:text-sm md:text-base text-blue-600 space-y-1 list-disc list-inside">
          <li>Le nom est le seul champ requis</li>
          <li>Le numéro de téléphone aide pour les notifications SMS</li>
          <li>
            L&apos;email est facultatif mais utile pour la communication
            digitale
          </li>
          <li>
            Les informations médicales et objectifs physiques sont facultatifs
          </li>
          <li>
            Vous pouvez ajouter ou modifier ces détails plus tard dans le profil
            du client
          </li>
        </ul>
      </div>
    </div>
  );
}
