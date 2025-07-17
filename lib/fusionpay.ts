import { FusionPay } from "fusionpay";

interface PaymentInfo {
  orderId: string;
  customerEmail: string;
  [key: string]: any;
}

// Define the expected response structure
interface FusionPayResponse {
  statut: boolean;
  token: string;
  message: string;
  url: string;
}

const fusionPay = new FusionPay<PaymentInfo>(
  process.env.NEXT_PUBLIC_FUSIONPAY_API_URL!
);

export const createPayment = async (paymentData: {
  totalPrice: number;
  articles: { name: string; price: number }[];
  clientName: string;
  clientNumber: string;
  returnUrl: string;
  metadata: PaymentInfo;
}) => {
  try {
    // Initialize payment builder
    const payment = fusionPay
      .totalPrice(paymentData.totalPrice)
      .clientName(paymentData.clientName)
      .clientNumber(paymentData.clientNumber)
      .returnUrl(paymentData.returnUrl)
      .addInfo(paymentData.metadata);

    // Add articles
    paymentData.articles.forEach((article) => {
      payment.addArticle(article.name, article.price);
    });

    // Make payment request
    const response = (await payment.makePayment()) as FusionPayResponse;

    console.log("Payment response:", response);
    console.log("Response type:", typeof response);
    console.log("Response keys:", Object.keys(response));

    // Check if the response has the expected structure
    if (!response) {
      throw new Error("No response received from payment gateway");
    }

    if (!response.statut) {
      throw new Error(response.message || "Payment request failed");
    }

    // Check for URL in the response
    const paymentUrl = response.url;
    if (!paymentUrl) {
      console.error(
        "No URL in response. Full response:",
        JSON.stringify(response, null, 2)
      );
      throw new Error("No payment URL received from gateway");
    }

    return {
      success: true,
      payment_url: paymentUrl,
      token: response.token,
      message: response.message,
    };
  } catch (error) {
    console.error("Payment creation failed:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error("Failed to create payment");
  }
};

export const verifyPayment = async (token: string) => {
  try {
    const status = await fusionPay.checkPaymentStatus(token);

    console.log("Payment verification response:", status);

    if (!status.statut) {
      throw new Error(status.message || "Payment verification failed");
    }

    return {
      success: status.data.statut === "paid",
      status: status.data.statut,
      data: status.data,
    };
  } catch (error) {
    console.error("Payment verification failed:", error);
    throw new Error("Payment verification failed");
  }
};
