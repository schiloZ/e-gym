"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Lock, Mail, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

export default function Login() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      if (
        (session?.user as any)?.role === "superadmin" ||
        (session?.user as any)?.isSuperAdmin
      ) {
        router.push("/dashboardAdmin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null); // Effacer l'erreur lorsque l'utilisateur commence à taper
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const toastId = toast.loading("Connexion en cours..."); // Afficher un toast de chargement

    const result = await signIn("credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
    });

    toast.dismiss(toastId); // Fermer le toast de chargement

    if (result?.error) {
      setError(result.error);
      toast.error(result.error, {
        duration: 4000,
      });
    } else {
      toast.success("Connecté avec succès !", {
        duration: 3000,
      });
      // La redirection sera gérée par useEffect en fonction de la session
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Lock className="h-6 w-6 mr-2 text-blue-500" />
          Connexion à E-Gym
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                placeholder="Entrez votre email"
                required
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                placeholder="Entrez votre mot de passe"
                required
              />
            </div>
          </div>
          {error && (
            <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md flex items-center justify-center"
          >
            Se connecter <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Pas encore de compte ? <br />
          Écrivez moi au +225 05-84-18-53-67 par whatsApp.
        </p>
      </div>
    </div>
  );
}
