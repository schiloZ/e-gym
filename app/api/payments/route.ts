import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb"; // For ObjectId validation

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "PAYMENT",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: "unknown",
        description: "Unauthorized attempt to create a payment",
      },
    });
    return NextResponse.json(
      { error: "Unauthorized: User not authenticated" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

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
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "PAYMENT",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: userId,
        description: "Client email and amount are required",
      },
    });
    return NextResponse.json(
      { error: "Client email and amount are required" },
      { status: 400 }
    );
  }

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "PAYMENT",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: userId,
        description: "Amount must be a positive number",
      },
    });
    return NextResponse.json(
      { error: "Amount must be a positive number" },
      { status: 400 }
    );
  }

  if (!startDate || !endDate || !nextPaymentDate) {
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "PAYMENT",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: userId,
        description: "Start date, end date, and next payment date are required",
      },
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
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check payment limit
  if (user.paymentCount >= user.maxPayments) {
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
      await prisma.historic.create({
        data: {
          action: "CREATE",
          entityType: "PAYMENT",
          entityId: "unknown",
          oldData: null,
          newData: null,
          changedBy: userId,
          description: "Client not found",
        },
      });
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    if (client.userId !== userId) {
      await prisma.historic.create({
        data: {
          action: "CREATE",
          entityType: "PAYMENT",
          entityId: "unknown",
          oldData: null,
          newData: null,
          changedBy: userId,
          description: "Client does not belong to the authenticated user",
        },
      });
      return NextResponse.json(
        { error: "Client does not belong to the authenticated user" },
        { status: 403 }
      );
    }

    const paymentData: any = {
      amount: parsedAmount,
      subscription: subscription || "Monthly",
      method: method || "Cash",
      status: status || "Pending",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      nextPaymentDate: new Date(nextPaymentDate),
      paymentStatus: paymentStatus || "Unpaid",
      date: new Date(), // Current date: 03:37 PM GMT, May 14, 2025
      client: {
        connect: { id: client.id },
      },
      user: {
        connect: { id: userId },
      },
    };

    if (paymentDate) {
      paymentData.paymentDate = new Date(paymentDate);
    }

    const payment = await prisma.payment.create({
      data: paymentData,
    });

    // Increment payment count
    await prisma.user.update({
      where: { id: userId },
      data: { paymentCount: { increment: 1 } },
    });

    const newData = {
      amount: parsedAmount,
      subscription: subscription || "Monthly",
      method: method || "Cash",
      status: status || "Pending",
      startDate,
      endDate,
      nextPaymentDate,
      paymentDate,
      paymentStatus: paymentStatus || "Unpaid",
      clientId: client.id,
    };

    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "PAYMENT",
        entityId: payment.id,
        paymentId: payment.id,
        oldData: null,
        newData,
        changedBy: userId,
        description: "Payment created successfully",
      },
    });

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
  } catch (error: any) {
    console.error("Payment creation error:", error);
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "PAYMENT",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: userId,
        description: `Error creating payment: ${
          error.message || "Unknown error"
        }`,
      },
    });
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
