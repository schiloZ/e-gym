"use client";

import { useState, useEffect } from "react";
import { QrCode, Download, Copy, Check, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import QRCode from "qrcode";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function QRCodePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  useEffect(() => {
    if (!session) {
      router.push("/");
      return;
    }

    if ((session.user as any)?.role !== "manager") {
      router.push("/dashboard/clients");
      return;
    }

    fetchClients();
  }, [session, router]);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/clients", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch clients");

      const data = await response.json();
      console.log("Fetched Clients:", data);
      setClients(data);
    } catch (error) {
      toast.error("Error loading clients");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      const gymId = (session?.user as any)?.companyId;
      const selectedClient = clients.find((c) => c.id === selectedClientId);

      const payload = {
        gymId,
        sessionId: sessionId || null,
        client: selectedClient
          ? {
              id: selectedClient.id,
              name: selectedClient.name,
              email: selectedClient.email,
              phone: selectedClient.phone,
            }
          : null,
        timestamp: new Date().toISOString(),
      };

      const encodedPayload = encodeURIComponent(JSON.stringify(payload));
      console.log("QR Payload:", payload);
      const checkInUrl = `${window.location.origin}/client-qr?gym=${gymId}`;

      const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
        width: 400,
        margin: 2,
        color: { dark: "#1e40af", light: "#ffffff" },
      });

      setQrCodeUrl(qrCodeDataUrl);
      toast.success("QR Code generated!");
    } catch (error) {
      toast.error("Error generating QR Code");
      console.error("QR generation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `gym-qrcode-${new Date().toISOString().split("T")[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code downloaded!");
  };

  const copyQRCodeUrl = () => {
    if (!qrCodeUrl) return;

    const gymId = (session?.user as any)?.companyId;
    const url = `${window.location.origin}/client-qr?gym=${gymId}${
      sessionId ? `&session=${encodeURIComponent(sessionId)}` : ""
    }${
      selectedClientId ? `&client=${encodeURIComponent(selectedClientId)}` : ""
    }`;

    navigator.clipboard
      .writeText(url)
      .then(() => {
        setIsCopied(true);
        toast.success("Link copied!");
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(() => toast.error("Copy failed"));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <QrCode className="h-6 w-6 text-blue-600" />
              Gym Registration QR Code
            </h1>
          </div>

          <div className="border-b border-gray-200 pb-6 mb-6">
            <p className="text-gray-600 mb-4">
              Ce code QR permet aux clients de s&apos;linscrire ou
              d&apos;leffectuer des paiements. Lorsqu&apos;lil est scanné, ils
              seront redirigés vers une page sécurisée pour compléter leurs
              informations. Ainsi vous et le client recevrons un email de
              confirmation.
            </p>

            {/* <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session ID (optional)
                </label>
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., SUMMER2023"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add an ID to track specific campaigns
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Client (optional)
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading || clients.length === 0}
                >
                  <option value="">New client registration</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email || client.phone})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Preselect a client for payment
                </p>
              </div>
            </div> */}

            <button
              onClick={generateQRCode}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              {isLoading ? "Generating..." : "Generer le code QR"}
            </button>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6 rounded">
              <h3 className="font-medium text-blue-700 mb-2">Usage Tips:</h3>
              <ul className="list-disc pl-5 text-blue-600 space-y-1 text-sm">
                <li>
                  Imprimez et affichez-le à l&apos;entrée de votre salle de
                  sport
                </li>
                <li>
                  Les clients peuvent le scanner avec l&apos;appareil photo de
                  n’importe quel smartphone
                </li>
                <li>Aucune installation d’application requise</li>
              </ul>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : qrCodeUrl ? (
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
                  <img
                    src={qrCodeUrl}
                    alt="Gym Registration QR Code"
                    className="w-full max-w-xs h-auto"
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={downloadQRCode}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>

                  <button
                    onClick={copyQRCodeUrl}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {isCopied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-lg text-gray-800 mb-4">
                    Client Instructions
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        step: 1,
                        title: "Scan the QR Code",
                        description:
                          "Use your smartphone camera or any QR scanner app",
                      },
                      {
                        step: 2,
                        title: "Complete Your Information",
                        description:
                          "Fill in the required details on the secure page",
                      },
                      {
                        step: 3,
                        title: "Submit Payment",
                        description:
                          "Choose your payment method and complete registration",
                      },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-3">
                        <div className="bg-blue-100 text-blue-600 rounded-full p-1.5 mt-0.5">
                          <span className="font-bold text-sm">{item.step}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {item.title}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <User className="mx-auto h-12 w-12 mb-4 text-gray-300" />
              <p>Generer le code QR pour l&apos;afficher ici</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
