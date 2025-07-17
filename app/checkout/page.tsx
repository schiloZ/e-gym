"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle,
  ArrowLeft,
  Star,
  Zap,
  AlertCircle,
  CreditCard,
  Shield,
} from "lucide-react";

const CheckoutPage = () => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [isProcessing, setIsProcessing] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("registrationData");
    if (data) {
      try {
        setRegistrationData(JSON.parse(data));
      } catch (e) {
        setError("Invalid registration data");
        router.push("/register");
      }
    } else {
      setError("No registration data found");
      router.push("/register");
    }
  }, [router]);

  const plans = {
    premium: {
      name: "Premium",
      price: 200,
      currency: "XOF",
      articles: [{ name: "Premium Subscription", price: 200 }],
      features: [
        "50 client registrations",
        "100 payments",
        "Priority support",
        "Advanced analytics",
      ],
    },
    enterprise: {
      name: "Enterprise",
      price: 300,
      currency: "XOF",
      articles: [{ name: "Enterprise Subscription", price: 300 }],
      features: [
        "300 client registrations",
        "1000 payments",
        "Dedicated manager",
        "Custom integrations",
      ],
    },
  };

  const handlePayment = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      if (!registrationData) {
        throw new Error("Registration data not loaded");
      }

      const plan = plans[selectedPlan as keyof typeof plans];
      if (!plan) {
        throw new Error("Invalid plan selected");
      }

      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          totalPrice: plan.price,
          articles: plan.articles,
          clientName: registrationData.name || "Customer",
          clientNumber: registrationData.phone,
          returnUrl: `${window.location.origin}/payment-success`,
          orderId: `order-${Date.now()}`,
          customerEmail: registrationData.email,
          metadata: {
            plan: selectedPlan, // Include plan in metadata
            userId: registrationData.userId, // If available
          },
        }),
      });

      const data = await response.json();
      console.log(data);
      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate payment");
      }

      if (!data.payment_url) {
        throw new Error("No payment URL received");
      }
      router.push(data.payment_url);
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!registrationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex items-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500 mr-3" />
          <span className="text-lg">Loading your registration details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-500"></div>
      </div>

      {/* Error message */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg flex items-start">
            <AlertCircle className="h-6 w-6 mr-2 flex-shrink-0" />
            <div>
              <p className="font-bold">Payment Error</p>
              <p>{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="flex items-center text-white">
            <Shield className="w-6 h-6 mr-2" />
            <span className="text-sm">Secured by FusionPay</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Left Column - Plan Selection */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl font-bold text-white mb-4">
                Complete Your Subscription
              </h1>
              <p className="text-gray-300 text-lg">
                Choose the plan that fits your needs and complete your
                registration
              </p>
            </div>

            {/* Plan Cards */}
            <div className="space-y-4">
              {Object.entries(plans).map(([key, plan]) => (
                <div
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    selectedPlan === key
                      ? "bg-white/20 border-2 border-white/40 shadow-2xl"
                      : "bg-white/10 border border-white/20 hover:bg-white/15"
                  }`}
                >
                  {key === "premium" && (
                    <div className="absolute -top-3 left-6">
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        RECOMMENDED
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline text-white">
                        <span className="text-3xl font-bold">
                          {plan.price.toLocaleString()}
                        </span>
                        <span className="text-lg ml-1">{plan.currency}</span>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedPlan === key
                          ? "border-white bg-white"
                          : "border-white/40"
                      }`}
                    >
                      {selectedPlan === key && (
                        <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center text-gray-300"
                      >
                        <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Checkout Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-full">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Confirm Your Details
            </h2>

            {/* Customer Information */}
            <div className="bg-white/10 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                Your Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-300">Email</p>
                  <p className="text-white">{registrationData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Phone</p>
                  <p className="text-white">{registrationData.phone}</p>
                </div>
                {registrationData.companyName && (
                  <div>
                    <p className="text-sm text-gray-300">Company</p>
                    <p className="text-white">{registrationData.companyName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white/10 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                Order Summary
              </h3>
              <div className="space-y-3">
                {plans[selectedPlan as keyof typeof plans].articles.map(
                  (article, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-white"
                    >
                      <span>{article.name}</span>
                      <span>{article.price.toLocaleString()} XOF</span>
                    </div>
                  )
                )}
              </div>
              <div className="border-t border-white/20 pt-4 mt-4">
                <div className="flex justify-between items-center text-white font-bold text-lg">
                  <span>Total</span>
                  <span>
                    {plans[
                      selectedPlan as keyof typeof plans
                    ].price.toLocaleString()}{" "}
                    XOF
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-3" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Pay with FusionPay
                </div>
              )}
            </button>

            {/* Trust Indicators */}
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center text-gray-400 text-sm">
                <Shield className="w-4 h-4 mr-2" />
                <span>Your payment information is secure and encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
