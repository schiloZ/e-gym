import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    await prisma.historic.create({
      data: {
        action: "READ",
        entityType: "BILL",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: "unknown",
        description: "Unauthorized attempt to fetch bills",
      },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const billsPerDay = await prisma.bill.groupBy({
      by: ["date"],
      where: { userId: session.user.id },
      _sum: { amount: true },
      orderBy: { date: "asc" },
    });

    const result = billsPerDay.map((entry) => ({
      date: entry.date.toISOString().split("T")[0],
      totalAmount: entry._sum.amount || 0,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    await prisma.historic.create({
      data: {
        action: "READ",
        entityType: "BILL",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: session.user.id,
        description: `Error fetching bills amount per day: ${
          error.message || "Unknown error"
        }`,
      },
    });
    return NextResponse.json(
      { error: "Error fetching bills amount per day" },
      { status: 500 }
    );
  }
}

export async function GET_(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    await prisma.historic.create({
      data: {
        action: "READ",
        entityType: "BILL",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: "unknown",
        description: "Unauthorized attempt to fetch bills",
      },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bills = await prisma.bill.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(bills);
  } catch (error: any) {
    await prisma.historic.create({
      data: {
        action: "READ",
        entityType: "BILL",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: session.user.id,
        description: `Error fetching bills: ${
          error.message || "Unknown error"
        }`,
      },
    });
    return NextResponse.json(
      { error: "Error fetching bills" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "BILL",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: "unknown",
        description: "Unauthorized attempt to create a bill",
      },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Hypothetical bill limit based on subscription type
  const billLimits = {
    free: 10,
    premium: 50,
    enterprise: 100,
  };
  const maxBills =
    billLimits[user.subscriptionType as keyof typeof billLimits] || 10;
  const billCount = await prisma.bill.count({
    where: { userId: session.user.id },
  });

  if (billCount >= maxBills) {
    return NextResponse.json(
      {
        error: `Limit of ${maxBills} bills reached for your ${user.subscriptionType} plan. Upgrade to increase limit.`,
      },
      { status: 403 }
    );
  }

  const { description, amount, date, category } = await request.json();

  if (!description || amount <= 0) {
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "BILL",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: session.user.id,
        description: "Failed to create bill: Description or amount invalid",
      },
    });
    return NextResponse.json(
      { error: "Description and valid amount are required" },
      { status: 400 }
    );
  }

  try {
    const bill = await prisma.bill.create({
      data: {
        description,
        amount: Math.round(amount), // Ensure integer for XOF
        date: new Date(date),
        category,
        userId: session.user.id,
      },
    });

    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "BILL",
        entityId: bill.id,
        clientId: null,
        oldData: null,
        newData: {
          description,
          amount,
          date,
          category,
        },
        changedBy: session.user.id,
        description: "Bill created successfully",
      },
    });

    await prisma.notification.create({
      data: {
        type: "BILL_ADDED",
        message: `${description} of ${formatCurrency(amount)} added today`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: "Bill added", bill });
  } catch (error: any) {
    console.error("Bill creation error:", error);
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "BILL",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: session.user.id,
        description: `Error creating bill: ${error.message || "Unknown error"}`,
      },
    });
    return NextResponse.json(
      { error: error.message || "Error creating bill" },
      { status: 400 }
    );
  }
}

// Helper function to format currency (used in notification message)
function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value);
}
