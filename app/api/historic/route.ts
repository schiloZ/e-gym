import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    !session.user.id ||
    !(session.user as any).companyId
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }

  const companyId = (session.user as any).companyId;

  try {
    const historyEntries = await prisma.historic.findMany({
      where: {
        companyId, // Directly filter by companyId
      },
      include: {
        user: true, // Include the user to get the username (email in this case)
        client: true, // Include client details if applicable
        payment: true, // Include payment details if applicable
        bill: true, // Include bill details if applicable
      },
      orderBy: {
        createdAt: "desc", // Most recent first
      },
    });

    // Map the entries to include the username and format the response
    const formattedEntries = historyEntries.map((entry) => ({
      id: entry.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      oldData: entry.oldData,
      newData: entry.newData,
      changedBy: {
        id: entry.changedBy,
        username: entry.user?.email || "Unknown", // Use email as username
      },
      createdAt: entry.createdAt,
      description: entry.description,
      client: entry.client
        ? {
            id: entry.client.id,
            name: entry.client.name,
            email: entry.client.email,
          }
        : null,
      payment: entry.payment
        ? {
            id: entry.payment.id,
            amount: entry.payment.amount,
            subscription: entry.payment.subscription,
            method: entry.payment.method,
            status: entry.payment.status,
          }
        : null,
      bill: entry.bill
        ? {
            id: entry.bill.id,
            description: entry.bill.description,
            amount: entry.bill.amount,
            date: entry.bill.date,
            category: entry.bill.category,
          }
        : null,
    }));

    return NextResponse.json(formattedEntries);
  } catch (error) {
    console.error("Error fetching history entries:", error);
    return NextResponse.json(
      { error: "Error fetching history entries" },
      { status: 500 }
    );
  }
}
