/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions as any);
  if (
    !session ||
    typeof session !== "object" ||
    !("user" in session) ||
    !session.user ||
    !(session.user as any).id ||
    !(session.user as any).companyId
  ) {
    console.error("Unauthorized access attempt");
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }

  try {
    const bills = await prisma.bill.findMany({
      where: { companyId: (session.user as any).companyId },
      orderBy: { date: "desc" },
    });
    console.log(bills);
    return NextResponse.json(bills);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error fetching bills" },
      { status: 500 }
    );
  }
}

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
    console.error("Unauthorized access attempt");
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
  });

  if (!user) {
    console.error("User not found:", (session.user as any).id);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // // Hypothetical bill limit based on subscription type
  // const billLimits = {
  //   free: 10,
  //   premium: 50,
  //   enterprise: 100,
  // };
  // const maxBills = billLimits[user.subscriptionType] || 10;
  // const billCount = await prisma.bill.count({
  //   where: { companyId: session.user.companyId },
  // });

  // if (billCount >= maxBills) {
  //   console.error(
  //     `Bill limit reached: ${billCount} bills for user ${session.user.id}`
  //   );
  //   return NextResponse.json(
  //     {
  //       error: `Limit of ${maxBills} bills reached for your ${user.subscriptionType} plan. Upgrade to increase limit.`,
  //     },
  //     { status: 403 }
  //   );
  // }

  const { description, amount, date, category } = await request.json();

  if (!description || amount <= 0) {
    console.error("Invalid bill data:", description, amount);
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
        companyId: (session.user as any).companyId, // Associate with the company
      },
    });

    const company = await prisma.company.findUnique({
      where: { id: (session.user as any).companyId },
      select: { subscriptionType: true },
    });
    if (company?.subscriptionType !== "free") {
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
          companyId: (session.user as any).companyId,
          description: "Bill created successfully",
        },
      });
    } else {
      console.log("Historic record not created for free subscription");
    }

    await prisma.notification.create({
      data: {
        type: "BILL_ADDED",
        message: `${description} of ${formatCurrency(amount)} added today`,
        companyId: (session.user as any).companyId,
        userId: (session.user as any).id,
      },
    });

    return NextResponse.json({ message: "Bill added", bill });
  } catch (error) {
    console.error("Bill creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error creating bill" },
      { status: 400 }
    );
  }
}

// Helper function to format currency (used in notification message)
function formatCurrency(value: number | bigint) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value);
}
