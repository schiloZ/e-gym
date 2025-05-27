import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb"; // For ObjectId validation

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    !session.user.id ||
    !session.user.companyId
  ) {
    console.error("Unauthorized access attempt:");
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const companyId = session.user.companyId;

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

  if (!clientEmail || !amount) {
    console.error("Missing required fields:");
    return NextResponse.json(
      { error: "Client email and amount are required" },
      { status: 400 }
    );
  }

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    console.error("Invalid amount provided:", amount);
    return NextResponse.json(
      { error: "Amount must be a positive number" },
      { status: 400 }
    );
  }

  if (!startDate || !endDate || !nextPaymentDate) {
    console.error("Missing date fields:", {
      startDate,
      endDate,
      nextPaymentDate,
    });
    return NextResponse.json(
      { error: "Start date, end date, and next payment date are required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error("User not found:", userId);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check payment limit
  if (user.paymentCount >= user.maxPayments) {
    console.error(
      `Payment limit reached for user ${userId}: ${user.paymentCount} payments`
    );
    return NextResponse.json(
      {
        error: `Limit of ${user.maxPayments} payments reached for your ${user.subscriptionType} plan. Upgrade to increase limit.`,
      },
      { status: 403 }
    );
  }

  try {
    const client = await prisma.client.findUnique({
      where: { email: clientEmail },
    });
    if (!client) {
      console.error("Client not found:", clientEmail);
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    if (client.companyId !== companyId) {
      console.log("Client does not belong to the authenticated user's company");
      return NextResponse.json(
        { error: "Client does not belong to the authenticated user's company" },
        { status: 403 }
      );
    }

    const paymentData = {
      amount: parsedAmount,
      subscription: subscription || "Monthly",
      method: method || "Cash",
      status: "Completed",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      nextPaymentDate: new Date(nextPaymentDate),
      paymentStatus: paymentStatus || "Paid",
      date: new Date(), // Current date: 11:12 AM GMT, May 16, 2025
      client: {
        connect: { id: client.id },
      },
      user: {
        connect: { id: userId },
      },
      company: {
        connect: { id: companyId },
      },
    };

    if (paymentDate) {
      paymentData.paymentDate = new Date(paymentDate);
    }
    const company1 = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { paymentCount: true, maxPayments: true, subscriptionType: true },
    });
    if (
      company1 &&
      company1.maxPayments &&
      company1.paymentCount >= company1.maxPayments
    ) {
      return NextResponse.json(
        {
          error: `Vous avez atteint la limite de ${company1.maxPayments} paiements pour votre plan. Veuillez mettre à niveau votre abonnement pour augmenter cette limite.`,
        },
        { status: 403 }
      );
    }
    const payment = await prisma.payment.create({
      data: paymentData,
    });

    // Increment client registration count for the company1
    await prisma.company.update({
      where: { id: session.user.companyId },
      data: { paymentCount: { increment: 1 } },
    });

    const newData = {
      amount: parsedAmount,
      subscription: subscription || "Monthly",
      method: method || "Cash",
      status: "Completed",
      startDate,
      endDate,
      nextPaymentDate,
      paymentDate,
      paymentStatus: paymentStatus || "Unpaid",
      clientName: client.name,
    };
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { subscriptionType: true },
    });
    if (company?.subscriptionType !== "free") {
      await prisma.historic.create({
        data: {
          action: "CREATE",
          entityType: "PAYMENT",
          entityId: payment.id,
          paymentId: payment.id,
          oldData: null,
          newData,
          changedBy: userId,
          companyId: session?.user?.companyId,
          description: "Payment created successfully",
        },
      });
    } else {
      console.log("Historic record not created for free subscription");
    }

    // Create a notification for the user
    await prisma.notification.create({
      data: {
        type: "PAYMENT_RECEIVED",
        message: `${parsedAmount.toLocaleString()} FCFA from ${client.name}`,
        userId: userId,
        paymentId: payment.id,
      },
    });

    return NextResponse.json({ message: "Payment recorded", payment });
  } catch (error) {
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

  // Check if the user is authenticated and has a companyId
  if (
    !session ||
    !session.user ||
    !session.user.id ||
    !session.user.companyId
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const companyId = session.user.companyId;

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
        companyId, // Fetch payments for the authenticated user's company
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
