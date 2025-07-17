import { NextResponse } from "next/server";
import { createPayment } from "@/lib/fusionpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.totalPrice || !body.clientName || !body.clientNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create payment through FusionPay
    const result = await createPayment({
      totalPrice: body.totalPrice,
      articles: body.articles || [],
      clientName: body.clientName,
      clientNumber: body.clientNumber,
      returnUrl: body.returnUrl,
      metadata: {
        orderId: body.orderId,
        customerEmail: body.customerEmail,
        // Add any additional metadata
      },
    });
    console.log("Payment initiation result:", result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { error: error.message || "Payment initiation failed" },
      { status: 500 }
    );
  }
}
