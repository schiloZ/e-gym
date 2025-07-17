import { NextResponse } from "next/server";
import { verifyPayment } from "@/lib/fusionpay";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Using the verifyPayment function here
    const result = await verifyPayment(token);

    if (!result.success) {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Here you would update your database, activate subscription, etc.
    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
