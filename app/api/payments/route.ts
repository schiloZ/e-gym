import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb"; // For ObjectId validation

export async function POST(request: Request) {
  // Get the session
  const session = await getServerSession(authOptions);

  // Check if the user is authenticated
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { error: "Unauthorized: User not authenticated" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // Validate userId as a MongoDB ObjectId
  if (!ObjectId.isValid(userId)) {
    return NextResponse.json(
      { error: "Invalid user ID format" },
      { status: 400 }
    );
  }

  const {
    clientEmail,
    amount,
    subscription,
    method,
    status,
    startDate,
    endDate,
    nextPaymentDate,
    paymentDate,
    paymentStatus,
  } = await request.json();

  // Validate required fields
  if (!clientEmail || !amount) {
    return NextResponse.json(
      { error: "Client email and amount are required" },
      { status: 400 }
    );
  }

  // Validate amount
  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json(
      { error: "Amount must be a positive number" },
      { status: 400 }
    );
  }

  // Validate required date fields
  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Start date and end date are required" },
      { status: 400 }
    );
  }

  try {
    // Find the client by email and verify it belongs to the user
    const client = await prisma.client.findUnique({
      where: { email: clientEmail },
    });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    if (client.userId !== userId) {
      return NextResponse.json(
        { error: "Client does not belong to the authenticated user" },
        { status: 403 }
      );
    }

    // Validate clientId as a MongoDB ObjectId
    if (!ObjectId.isValid(client.id)) {
      return NextResponse.json(
        { error: "Invalid client ID format" },
        { status: 400 }
      );
    }

    // Prepare the data object, handling nullable fields correctly
    const paymentData: any = {
      amount: parsedAmount,
      subscription: subscription || "Monthly",
      method: method || "Cash",
      status: status || "Pending",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      paymentStatus: paymentStatus || "Unpaid",
      date: new Date(), // Explicitly set date, even though it has a default
      client: {
        connect: { id: client.id },
      },
      user: {
        connect: { id: userId },
      },
    };

    // Only include nullable fields if they have a value
    if (nextPaymentDate) {
      paymentData.nextPaymentDate = new Date(nextPaymentDate);
    }
    if (paymentDate) {
      paymentData.paymentDate = new Date(paymentDate);
    }

    // Create the payment
    const payment = await prisma.payment.create({
      data: paymentData,
    });

    return NextResponse.json({ message: "Payment recorded", payment });
  } catch (error: any) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: error.message || "Error recording payment" },
      { status: 400 }
    );
  }
}

export async function GET(request: Request) {
  // Get the session
  const session = await getServerSession(authOptions);

  // Check if the user is authenticated
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { error: "Unauthorized: User not authenticated" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // Validate userId as a MongoDB ObjectId
  if (!ObjectId.isValid(userId)) {
    return NextResponse.json(
      { error: "Invalid user ID format" },
      { status: 400 }
    );
  }

  try {
    const payments = await prisma.payment.findMany({
      where: {
        userId, // Only fetch payments for the authenticated user
      },
      include: {
        client: {
          include: { user: true }, // Include client and its user
        },
      },
      orderBy: {
        date: "desc", // Sort by most recent
      },
    });
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching payments" },
      { status: 500 }
    );
  }
}
