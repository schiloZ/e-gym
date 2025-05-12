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

  console.log("Client ID from params:", clientId);

  // Fetch client data on mount
  useEffect(() => {
    const fetchClient = async () => {
      if (status === "loading") return;
      if (!session) {
        router.push("/");
        return;
      }

      if (!clientId || typeof clientId !== "string") {
        setError("Invalid or missing client ID");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/clients/${clientId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `Failed to fetch client data (Status: ${response.status})`
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
        console.error("Fetch error:", err);
        setError(err.message || "An error occurred while fetching client data");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [session, status, router, clientId]);

  // Handle form submission
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
            `Failed to update client (Status: ${response.status})`
        );
      }

      const updatedClient = await response.json();
      setSuccess("Client updated successfully");
      setTimeout(() => router.push(`/dashboard/clients/${clientId}`), 2000); // Redirect after 2 seconds
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message || "An error occurred while updating client data");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        Loading...
      </div>
    );
  }

  if (!session) {
    return null; // Redirect handled in useEffect
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Link
            href={`/dashboard/clients/${clientId}`}
            className="mr-3 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-5 sm:h-6 w-5 sm:w-6" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center text-gray-800">
              <User className="h-5 sm:h-6 w-5 sm:w-6 mr-2 text-blue-600" />
              Edit Client
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Update client details
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
            <span>{success}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={client.name}
              onChange={(e) => setClient({ ...client, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={client.email}
              onChange={(e) => setClient({ ...client, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={client.phone}
              onChange={(e) => setClient({ ...client, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration Date
            </label>
            <input
              type="date"
              value={client.registrationDate}
              onChange={(e) =>
                setClient({ ...client, registrationDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
