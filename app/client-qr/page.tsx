"use client";

import { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  UserPlus,
  Calendar,
  AlertCircle,
  Check,
  User,
  Phone,
  Mail,
  Weight,
  Target,
  Users,
  Search,
  X,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import toast from "react-hot-toast";
import { ErrorBoundary } from "react-error-boundary";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  age: number | null;
  fitnessGoal: string | null;
}

function GymPaymentRegistrationContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("payment");
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const searchParams = useSearchParams();
  const params = useParams();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Get gymId from multiple possible sources
  const gymId =
    searchParams.get("gym") ||
    (params.gym && typeof params.gym === "string"
      ? params.gym.replace("gym=", "")
      : "") ||
    "";

  // Fetch clients from API on component mount
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true);
      try {
        const response = await fetch(`/api/clients/qr-code?gym=${gymId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch clients");
        }
        const clientsData = await response.json();
        setClients(clientsData);
        setFilteredClients(clientsData);
      } catch (err) {
        console.error("Error fetching clients:", err);
        toast.error("Erreur lors du chargement des clients.");
      } finally {
        setIsLoadingClients(false);
      }
    };

    if (gymId) {
      fetchClients();
    } else {
      toast.error("Identifiant de la salle de sport manquant.", {
        duration: 4000,
      });
      router.push("/");
    }
  }, [gymId, router]);

  // Handle clicks outside search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search filtering
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      if (searchTerm.trim() === "") {
        setFilteredClients(clients);
        setIsSearchOpen(false);
      } else {
        const filtered = clients.filter((client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredClients(filtered);
        setIsSearchOpen(true);
      }
      setSelectedIndex(-1);
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchTerm, clients]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredClients.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if ((e.key === "Enter ", filteredClients[selectedIndex])) {
      e.preventDefault();
      setPaymentData((prev) => ({
        ...prev,
        clientId: filteredClients[selectedIndex].id,
      }));
      setSearchTerm(filteredClients[selectedIndex].name);
      setIsSearchOpen(false);
      setSelectedIndex(-1);
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
      setSelectedIndex(-1);
    }
  };

  // Payment form data
  const [paymentData, setPaymentData] = useState({
    clientId: "",
    clientName: "", // Add this line
    amount: "",
    subscription: "Monthly",
    method: "Cash",
    paymentStatus: "Paid",
    startDate: new Date().toISOString().split("T")[0],
    endDate: calculateEndDate(new Date().toISOString().split("T")[0]),
    nextPaymentDate: calculateNextPaymentDate(
      calculateEndDate(new Date().toISOString().split("T")[0])
    ),
    paymentDate: new Date().toISOString().split("T")[0],
  });

  // Registration form data
  const [registrationData, setRegistrationData] = useState({
    name: "",
    phone: "",
    email: "",
    registrationDate: new Date().toISOString().split("T")[0],
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

  // Helper functions
  function calculateEndDate(startDate: string) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
  }

  function calculateNextPaymentDate(endDate: string) {
    const date = new Date(endDate);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0];
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!paymentData.clientId || !paymentData.amount) {
      setError("Veuillez sélectionner un client et saisir un montant.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/payments/qr-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...paymentData,
          gymId,
          clientName: paymentData.clientName, // Add this line
        }),
      });

      if (!response.ok) throw new Error("Payment failed");

      const data = await response.json();
      setSuccess("Paiement enregistré avec succès !");

      // Reset form
      setPaymentData({
        ...paymentData,
        clientId: "",
        clientName: "", // Reset clientName too
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
      });
      setSearchTerm("");
    } catch (err) {
      setError("Erreur lors de l'enregistrement du paiement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!registrationData.name) {
      setError("Le nom est requis");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/clients/qr-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...registrationData,
          gymId,
        }),
      });

      if (!response.ok) throw new Error("Registration failed");

      const data = await response.json();
      setSuccess("Client enregistré avec succès !");

      // Reset form
      setRegistrationData({
        name: "",
        phone: "",
        email: "",
        registrationDate: new Date().toISOString().split("T")[0],
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

      // Refresh client list
      const clientsResponse = await fetch(`/api/client/qr-code?gymId=${gymId}`);
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        setClients(clientsData);
        setFilteredClients(clientsData);
      }
    } catch (err) {
      setError("Erreur lors de l'enregistrement du client");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegistrationChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setRegistrationData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClientSelect = (client: Client) => {
    setPaymentData((prev) => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
    }));
    setSearchTerm(client.name);
    setIsSearchOpen(false);
    setSelectedIndex(-1);
  };

  const highlightMatch = (text: string, term: string) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, "gi");
    return text.replace(regex, "<mark class='bg-yellow-200'>$1</mark>");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Bienvenue à votre Salle de Sport
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Enregistrez votre paiement ou inscrivez-vous rapidement
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-1 sm:p-2 shadow-lg border border-gray-200 w-full max-w-md">
            <div className="flex space-x-14 sm:space-x-2">
              <button
                onClick={() => setActiveTab("payment")}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                  activeTab === "payment"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Paiement</span>
              </button>
              <button
                onClick={() => setActiveTab("registration")}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                  activeTab === "registration"
                    ? "bg-green-600 text-white shadow-md"
                    : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                }`}
              >
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Nouvelle inscription</span>
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm sm:text-base text-red-700">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm sm:text-base text-green-700">
            <Check className="h-4 w-4 sm:h-5 sm:w-5" />
            {success}
          </div>
        )}

        {/* Payment Form */}
        {activeTab === "payment" && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 border border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Enregistrer un paiement
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Sélectionnez votre profil et confirmez votre paiement
                </p>
              </div>
            </div>

            <form
              onSubmit={handlePaymentSubmit}
              className="space-y-4 sm:space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="md:col-span-2" ref={searchRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    <Users className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Rechercher un client
                  </label>
                  <div className="relative ">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>

                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsSearchOpen(true)}
                      className="w-full pl-20 pr-10 p-4 sm:p-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 text-sm sm:text-base"
                      placeholder="Rechercher par nom..."
                      autoComplete="off"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          setPaymentData((prev) => ({ ...prev, clientId: "" }));
                          setIsSearchOpen(false);
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                    {isSearchOpen && filteredClients.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredClients.map((client, index) => (
                          <div
                            key={client.id}
                            onClick={() => handleClientSelect(client)}
                            className={`px-4 py-2 cursor-pointer text-sm hover:bg-blue-50 ${
                              index === selectedIndex ? "bg-blue-100" : ""
                            }`}
                            dangerouslySetInnerHTML={{
                              __html: highlightMatch(
                                `${client.name} (${client.email || client.phone})`,
                                searchTerm
                              ),
                            }}
                          />
                        ))}
                      </div>
                    )}
                    {isSearchOpen &&
                      filteredClients.length === 0 &&
                      searchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-gray-600">
                          Aucun client trouvé
                        </div>
                      )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Montant (FCFA)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={paymentData.amount}
                    onChange={handlePaymentChange}
                    className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 text-sm sm:text-base"
                    placeholder="Ex: 15000"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Type d&apos;abonnement
                  </label>
                  <select
                    name="subscription"
                    value={paymentData.subscription}
                    onChange={handlePaymentChange}
                    className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 text-sm sm:text-base"
                  >
                    <option value="Daily">Quotidien</option>
                    <option value="Weekly">Hebdomadaire</option>
                    <option value="Monthly">Mensuel</option>
                    <option value="Quarterly">Trimestriel</option>
                    <option value="Yearly">Annuel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Méthode de paiement
                  </label>
                  <select
                    name="method"
                    value={paymentData.method}
                    onChange={handlePaymentChange}
                    className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 text-sm sm:text-base"
                  >
                    <option value="Cash">Espèces</option>
                    <option value="Mobile Money">
                      Mobile Money (MTN, Orange, Wave)
                    </option>
                    <option value="Credit Card">Carte de crédit</option>
                    <option value="Bank Transfer">Virement bancaire</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 bg-blue-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 text-sm sm:text-base ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-700 hover:shadow-md sm:hover:shadow-lg"
                  }`}
                >
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                  {isSubmitting ? "Traitement..." : "Confirmer le paiement"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Registration Form */}
        {activeTab === "registration" && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 border border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Nouvelle inscription
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Rejoignez notre communauté sportive
                </p>
              </div>
            </div>

            <form
              onSubmit={handleRegistrationSubmit}
              className="space-y-6 sm:space-y-8"
            >
              {/* Personal Information */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Informations personnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={registrationData.name}
                      onChange={handleRegistrationChange}
                      className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 text-sm sm:text-base"
                      placeholder="Jean Dupont"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      <Phone className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={registrationData.phone}
                      onChange={handleRegistrationChange}
                      className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 text-sm sm:text-base"
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      <Mail className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={registrationData.email}
                      onChange={handleRegistrationChange}
                      className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 text-sm sm:text-base"
                      placeholder="jean@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Information */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <Weight className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Informations physiques
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Taille (cm)
                    </label>
                    <input
                      type="number"
                      name="height"
                      value={registrationData.height}
                      onChange={handleRegistrationChange}
                      className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 text-sm sm:text-base"
                      placeholder="175"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Poids (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={registrationData.weight}
                      onChange={handleRegistrationChange}
                      className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 text-sm sm:text-base"
                      placeholder="70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Âge
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={registrationData.age}
                      onChange={handleRegistrationChange}
                      className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 text-sm sm:text-base"
                      placeholder="25"
                    />
                  </div>
                </div>
              </div>

              {/* Fitness Goals */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Objectifs fitness
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Objectif principal
                    </label>
                    <select
                      name="fitnessGoal"
                      value={registrationData.fitnessGoal}
                      onChange={handleRegistrationChange}
                      className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 text-sm sm:text-base"
                    >
                      <option value="">Sélectionnez un objectif</option>
                      <option value="weight loss">Perte de poids</option>
                      <option value="muscle gain">Gain musculaire</option>
                      <option value="endurance">Endurance</option>
                      <option value="general fitness">Forme générale</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Poids cible (kg)
                    </label>
                    <input
                      type="number"
                      name="targetWeight"
                      value={registrationData.targetWeight}
                      onChange={handleRegistrationChange}
                      className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 text-sm sm:text-base"
                      placeholder="65"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 bg-green-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 text-sm sm:text-base ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-green-700 hover:shadow-md sm:hover:shadow-lg"
                  }`}
                >
                  <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                  {isSubmitting ? "Inscription..." : "Confirmer l'inscription"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center text-gray-600">
          <p className="text-xs sm:text-sm">
            Besoin d&lsquo;aide ? Contactez notre équipe à l&apos;accueil
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}
function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div role="alert" className="p-4 bg-red-100 text-red-700 rounded">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}

export default function GymPaymentRegistrationPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingSpinner />}>
        <GymPaymentRegistrationContent />
      </Suspense>
    </ErrorBoundary>
  );
}
