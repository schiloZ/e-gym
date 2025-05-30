/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).id) {
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
      where: { companyId: (session.user as any).companyId },
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
        changedBy: (session.user as any).id,
        companyId: (session.user as any).companyId,
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
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).id) {
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
    where: { id: (session.user as any).id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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
        changedBy: (session.user as any).id,
        companyId: (session.user as any).companyId,
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
        userId: (session.user as any).id,
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
        changedBy: (session.user as any).id,
        description: "Bill created successfully",
      },
    });

    await prisma.notification.create({
      data: {
        type: "BILL_ADDED",
        message: `${description} of ${formatCurrency(amount)} added today`,
        userId: (session.user as any).id,
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
        changedBy: (session.user as any).id,
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
