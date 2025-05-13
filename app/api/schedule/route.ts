import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { error: "Unauthorized: User not authenticated" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    // Fetch all clients for the authenticated user
    const clients = await prisma.client.findMany({
      where: { userId },
      select: { id: true, name: true, registrationDate: true },
    });

    // Fetch all payments for the authenticated user
    const payments = await prisma.payment.findMany({
      where: { userId },
      select: {
        id: true,
        client: { select: { name: true } },
        amount: true,
        paymentDate: true,
        startDate: true,
        endDate: true,
        nextPaymentDate: true,
      },
    });

    // Fetch all historic entries for the authenticated user
    const historicEntries = await prisma.historic.findMany({
      where: { changedBy: userId },
      select: {
        id: true,
        entityType: true,
        description: true,
        createdAt: true,
      },
    });

    // Extract dates from clients
    const clientDates = clients
      .filter((client) => client.registrationDate)
      .map((client) => ({
        type: "Registration Date",
        date: client.registrationDate,
        source: "Client",
        entityId: client.id,
        entityName: client.name,
      }));

    // Extract dates from payments
    const paymentDates = payments
      .flatMap((payment) => [
        payment.paymentDate
          ? {
              type: "Payment Date",
              date: payment.paymentDate,
              source: "Payment",
              entityId: payment.id,
              entityName: payment.client?.name || "Unknown Client",
              amount: payment.amount,
            }
          : null,
        payment.startDate
          ? {
              type: "Start Date",
              date: payment.startDate,
              source: "Payment",
              entityId: payment.id,
              entityName: payment.client?.name || "Unknown Client",
              amount: payment.amount,
            }
          : null,
        payment.endDate
          ? {
              type: "End Date",
              date: payment.endDate,
              source: "Payment",
              entityId: payment.id,
              entityName: payment.client?.name || "Unknown Client",
              amount: payment.amount,
            }
          : null,
        payment.nextPaymentDate
          ? {
              type: "Next Payment Date",
              date: payment.nextPaymentDate,
              source: "Payment",
              entityId: payment.id,
              entityName: payment.client?.name || "Unknown Client",
              amount: payment.amount,
            }
          : null,
      ])
      .filter((date) => date !== null);

    // Extract dates from historic entries
    const historicDates = historicEntries
      .filter((entry) => entry.createdAt)
      .map((entry) => ({
        type: "Activity Date",
        date: entry.createdAt,
        source: "Historic",
        entityId: entry.id,
        entityName: entry.description,
      }));

    // Combine and sort all dates (most recent first)
    const allDates = [...clientDates, ...paymentDates, ...historicDates].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(allDates);
  } catch (error) {
    console.error("Error fetching dates:", error);
    return NextResponse.json(
      { error: "Error fetching dates" },
      { status: 500 }
    );
  }
}
