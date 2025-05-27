"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Users,
  Search,
  UserPlus,
  ArrowRight,
  Edit,
  Trash2,
  Eye,
  Download,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  registrationDate: string;
  imagePath?: string; // Optional Cloudflare image URL
  userId: string;
  companyId?: string;
  // Medical Information
  height?: number; // Height in centimeters
  weight?: number; // Weight in kilograms
  age?: number; // Age in years
  medicalConditions?: string; // JSON string or comma-separated
  allergies?: string; // JSON string or comma-separated
  injuries?: string; // JSON string or comma-separated
  medications?: string; // JSON string or comma-separated
  bloodPressure?: string; // Format: "systolic/diastolic"
  // Body Goals
  targetWeight?: number; // Target weight in kilograms
  fitnessGoal?: string; // E.g., "weight loss", "muscle gain"
  targetBodyFat?: number; // Target body fat percentage
  goalMilestone?: string; // Date to achieve the goal
}

declare global {
  interface Window {
    jspdf: any;
    autotable: any;
  }
}

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [companyInfo, setCompanyInfo] = useState<{
    subscriptionType: string | null;
  } | null>(null);
  useEffect(() => {
    const fetchCompanyInfo = async () => {
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
        });
      } catch (err: unknown) {
        toast.error((err as Error).message, { duration: 4000 });
      }
    };
    fetchCompanyInfo();
  }, []);
  const isStandardPlan = companyInfo?.subscriptionType !== "free";

  // Récupérer les clients au montage
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
        setFilteredClients(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des clients :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [session, status, router]);

  // Gérer la recherche
  useEffect(() => {
    const filtered = clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredClients(filtered);
    setCurrentPage(1); // Réinitialiser à la première page lors d'une nouvelle recherche
  }, [searchQuery, clients]);

  // Gérer la suppression d'un client
  const handleDelete = async (clientId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      try {
        await fetch(`/api/clients/${clientId}`, {
          method: "DELETE",
        });
        setClients(clients.filter((client) => client.id !== clientId));
        setFilteredClients(
          filteredClients.filter((client) => client.id !== clientId)
        );
      } catch (error) {
        console.error("Erreur lors de la suppression du client :", error);
      }
    }
  };

  // Fonction utilitaire pour échapper les valeurs CSV
  const escapeCSVValue = (value: string): string => {
    // Si la valeur contient des virgules, des guillemets ou des retours à la ligne
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      // Échapper les guillemets en les doublant et entourer la valeur de guillemets
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  // Fonction pour exporter les clients en CSV
  const exportToCSV = () => {
    // Définir les en-têtes du CSV, incluant tous les champs du schéma (sauf relations)
    const headers = [
      "Nom",
      "Email",
      "Téléphone",
      "Date d'inscription",
      "Taille (cm)",
      "Poids (kg)",
      "Âge",
      "Conditions médicales",
      "Allergies",
      "Blessures",
      "Médicaments",
      "Tension artérielle",
      "Poids cible (kg)",
      "Objectif de fitness",
      "Pourcentage de graisse corporelle cible",
      "Date de l'objectif",
    ];

    // Convertir les données des clients en lignes CSV
    const rows = filteredClients.map((client) => [
      escapeCSVValue(client.name),
      escapeCSVValue(client.email || "N/A"),
      escapeCSVValue(client.phone || "N/A"),
      escapeCSVValue(
        new Date(client.registrationDate).toLocaleDateString("fr-FR")
      ),
      escapeCSVValue(client.height?.toString() || "N/A"),
      escapeCSVValue(client.weight?.toString() || "N/A"),
      escapeCSVValue(client.age?.toString() || "N/A"),
      escapeCSVValue(client.medicalConditions || "N/A"),
      escapeCSVValue(client.allergies || "N/A"),
      escapeCSVValue(client.injuries || "N/A"),
      escapeCSVValue(client.medications || "N/A"),
      escapeCSVValue(client.bloodPressure || "N/A"),
      escapeCSVValue(client.targetWeight?.toString() || "N/A"),
      escapeCSVValue(client.fitnessGoal || "N/A"),
      escapeCSVValue(client.targetBodyFat?.toString() || "N/A"),
      escapeCSVValue(
        client.goalMilestone
          ? new Date(client.goalMilestone).toLocaleDateString("fr-FR")
          : "N/A"
      ),
    ]);

    // Combiner les en-têtes et les lignes en une seule chaîne CSV
    const csvContent = [
      headers.map(escapeCSVValue).join(","), // Première ligne : en-têtes
      ...rows.map((row) => row.join(",")), // Lignes de données
    ].join("\n");

    // Créer un fichier CSV téléchargeable
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `clients_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fonction pour exporter les clients en PDF
  const exportToPDF = () => {
    // Charger les bibliothèques jsPDF et autotable via CDN
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    document.body.appendChild(script);

    const autoTableScript = document.createElement("script");
    autoTableScript.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js";
    document.body.appendChild(autoTableScript);

    script.onload = () => {
      autoTableScript.onload = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        });

        // Définir les en-têtes du tableau
        const headers = [
          "Nom",
          "Email",
          "Téléphone",
          "Date d'inscription",
          "Taille (cm)",
          "Poids (kg)",
          "Âge",
          "Conditions médicales",
          "Allergies",
          "Blessures",
          "Médicaments",
          "Tension artérielle",
          "Poids cible (kg)",
          "Objectif de fitness",
          "Pourcentage de graisse corporelle cible",
          "Date de l'objectif",
        ];

        // Convertir les données des clients en lignes pour le tableau
        const rows = filteredClients.map((client) => [
          client.name,
          client.email || "N/A",
          client.phone || "N/A",
          new Date(client.registrationDate).toLocaleDateString("fr-FR"),
          client.height?.toString() || "N/A",
          client.weight?.toString() || "N/A",
          client.age?.toString() || "N/A",
          client.medicalConditions || "N/A",
          client.allergies || "N/A",
          client.injuries || "N/A",
          client.medications || "N/A",
          client.bloodPressure || "N/A",
          client.targetWeight?.toString() || "N/A",
          client.fitnessGoal || "N/A",
          client.targetBodyFat?.toString() || "N/A",
          client.goalMilestone
            ? new Date(client.goalMilestone).toLocaleDateString("fr-FR")
            : "N/A",
        ]);

        // Ajouter le titre
        doc.setFontSize(20);
        doc.text("Liste des Clients", 10, 10);
        doc.setFontSize(12);
        doc.text(
          `Exporté le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString(
            "fr-FR",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )}`,
          10,
          20
        );

        // Ajouter le tableau
        doc.autoTable({
          head: [headers],
          body: rows,
          startY: 30,
          theme: "grid",
          styles: { overflow: "linebreak", cellWidth: "wrap" },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 25 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 15 },
            5: { cellWidth: 15 },
            6: { cellWidth: 10 },
            7: { cellWidth: 20 },
            8: { cellWidth: 20 },
            9: { cellWidth: 20 },
            10: { cellWidth: 20 },
            11: { cellWidth: 20 },
            12: { cellWidth: 15 },
            13: { cellWidth: 20 },
            14: { cellWidth: 25 },
            15: { cellWidth: 20 },
          },
          margin: { top: 30 },
        });

        // Télécharger le PDF
        doc.save(
          `clients_export_${new Date().toISOString().split("T")[0]}.pdf`
        );
      };
    };
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

  // Pagination logic
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isManager = (session.user as any)?.role === "manager";
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-600 to-blue-800 p-4 sm:p-6 rounded-xl text-white shadow-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
            <Users className="h-5 sm:h-6 w-5 sm:w-6 mr-2" />
            Clients
          </h1>
          <p className="text-sm sm:text-base text-blue-100">
            Gérez vos clients efficacement
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {isManager && (
            <>
              <Link
                href="/dashboard/clients/new"
                className="bg-white text-blue-600 hover:bg-blue-50 py-2 px-3 sm:px-4 rounded-lg font-medium flex items-center gap-2 text-sm sm:text-base transition shadow-md w-full sm:w-auto"
              >
                <UserPlus className="h-4 sm:h-5 w-4 sm:w-5" />
                Ajouter un nouveau client
              </Link>
              {isStandardPlan && (
                <>
                  <button
                    onClick={exportToCSV}
                    className="bg-white text-blue-600 hover:bg-blue-50 py-2 px-3 sm:px-4 rounded-lg font-medium flex items-center gap-2 text-sm sm:text-base transition shadow-md w-full sm:w-auto"
                  >
                    <Download className="h-4 sm:h-5 w-4 sm:w-5" />
                    Exporter en Fichier Excel
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="bg-white text-blue-600 hover:bg-blue-50 py-2 px-3 sm:px-4 rounded-lg font-medium flex items-center gap-2 text-sm sm:text-base transition shadow-md w-full sm:w-auto"
                  >
                    <FileText className="h-4 sm:h-5 w-4 sm:w-5" />
                    Exporter en PDF
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recherche et filtres */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50 text-sm sm:text-base"
            placeholder="Rechercher par nom, email ou téléphone..."
          />
        </div>
      </div>

      {/* Liste des clients */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md overflow-hidden">
        <div className="space-y-3 sm:space-y-4">
          {paginatedClients.length === 0 ? (
            <div className="text-gray-500 text-center py-8 sm:py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Users className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-sm sm:text-base">
                Aucun client trouvé
              </p>
              <p className="text-xs sm:text-sm mt-1">
                Utilisez la barre de recherche ou ajoutez un nouveau client pour
                commencer
              </p>
            </div>
          ) : (
            paginatedClients.map((client) => (
              <div
                key={client.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition border border-gray-100 hover:border-blue-200"
              >
                <div className="mb-2 sm:mb-0">
                  <p className="font-semibold text-gray-800 text-sm sm:text-base">
                    {client.name}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                      <span className="text-blue-500">✉️</span>{" "}
                      {client.email || "N/A"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                      <span className="text-blue-500">📞</span>{" "}
                      {client.phone || "N/A"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <span className="text-blue-500">📅</span> Inscrit(e) le :{" "}
                    {new Date(client.registrationDate).toLocaleDateString(
                      "fr-FR"
                    )}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 transition w-full sm:w-auto"
                  >
                    <Eye className="h-3 sm:h-4 w-3 sm:w-4" />
                    Voir
                  </Link>
                  {isManager && (
                    <Link
                      href={`/dashboard/clients/${client.id}/edit`}
                      className="text-yellow-600 hover:text-yellow-800 bg-yellow-50 hover:bg-yellow-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 transition wfull sm:w-auto"
                    >
                      <Edit className="h-3 sm:h-4 w-3 sm:w-4" />
                      Modifier
                    </Link>
                  )}
                  {isManager && (
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 transition w-full sm:w-auto"
                    >
                      <Trash2 className="h-3 sm:h-4 w-3 sm:w-4" />
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {filteredClients.length > 0 && (
          <div className="mt-4 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                className={`p-2 rounded-lg border ${
                  currentPage === 1
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-200 hover:bg-gray-50 transition"
                }`}
                disabled={currentPage === 1}
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === page
                        ? "bg-blue-500 text-white font-medium"
                        : "border border-gray-200 hover:bg-gray-50 transition"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={handleNextPage}
                className={`p-2 rounded-lg border ${
                  currentPage === totalPages
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-200 hover:bg-gray-50 transition"
                }`}
                disabled={currentPage === totalPages}
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
