/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { ObjectId } from "mongodb"; // For ObjectId validation

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    typeof session !== "object" ||
    !("user" in session) ||
    !session.user ||
    !(session.user as any).id ||
    !(session.user as any).companyId
  ) {
    console.error("Unauthorized access attempt:");
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }

  const userId = (session.user as any).id;
  const companyId = (session.user as any).companyId;

  const {
    clientEmail,
    amount,
    subscription,
    method,
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
    include: {
      company: true,
    },
  });

  if (!user) {
    console.error("User not found:", userId);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check payment limit using company data instead of user
  if (user.company && user.company.paymentCount >= user.company.maxPayments) {
    console.error(
      `Payment limit reached for company: ${user.company.paymentCount} payments`
    );
    return NextResponse.json(
      {
        error: `Limit of ${user.company.maxPayments} payments reached for your ${user.company.subscriptionType} plan. Upgrade to increase limit.`,
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

    const paymentData: any = {
      amount: parsedAmount,
      subscription: subscription || "Monthly",
      method: method || "Cash",
      status: "Completed",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      nextPaymentDate: new Date(nextPaymentDate),
      paymentStatus: paymentStatus || "Paid",
      date: new Date(),
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
      where: { id: (session.user as any).companyId },
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

    await prisma.company.update({
      where: { id: (session.user as any).companyId },
      data: { paymentCount: { increment: 1 } },
    });

    const newData = {
      prix: parsedAmount,
      souscription: subscription || "Monthly",
      method: method || "Cash",
      status: "Payé",
      Debut: startDate,
      Fin: endDate,
      ProchaineDate: nextPaymentDate,
      clientName: client.name,
    };
    const company = await prisma.company.findUnique({
      where: { id: (session.user as any).companyId },
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
          companyId: (session.user as any).companyId,
          description: "Payment created successfully",
        },
      });
    } else {
      console.log("Historic record not created for free subscription");
    }

    await prisma.notification.create({
      data: {
        type: "PAYMENT_RECEIVED",
        message: `${parsedAmount.toLocaleString()} FCFA de ${client.name}`,
        userId: userId,
        paymentId: payment.id,
      },
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
export async function GET() {
  // Get the session
  const session = await getServerSession(authOptions);

  // Check if the user is authenticated and has a companyId
  if (
    !session ||
    typeof session !== "object" ||
    !("user" in session) ||
    !session.user ||
    !(session.user as any).id ||
    !(session.user as any).companyId
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }

  const userId = (session.user as any).id;
  const companyId = (session.user as any).companyId;

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error fetching payments" },
      { status: 500 }
    );
  }
}
