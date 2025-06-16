import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);

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

  const companyId = (session.user as any).companyId;

  try {
    // Fetch all clients for the authenticated user's company
    const clients = await prisma.client.findMany({
      where: { companyId },
      select: { id: true, name: true, registrationDate: true },
    });

    // Fetch all payments for the authenticated user's company
    const payments = await prisma.payment.findMany({
      where: { companyId },
      select: {
        id: true,
        client: { select: { name: true } },
        amount: true,
        subscription: true,
        paymentDate: true,
        startDate: true,
        endDate: true,
        nextPaymentDate: true,
      },
    });

    // Fetch all historic entries related to clients and payments within the company
    // const historicEntries = await prisma.historic.findMany({
    //   where: {
    //     OR: [
    //       { client: { companyId } }, // Historic entries linked to clients in the company
    //       { payment: { companyId } }, // Historic entries linked to payments in the company
    //     ],
    //   },
    //   select: {
    //     id: true,
    //     entityType: true,
    //     description: true,
    //     createdAt: true,
    //   },
    // });

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
              subscription: payment.subscription,
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
              subscription: payment.subscription,
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
              subscription: payment.subscription,
              entityName: payment.client?.name || "Unknown Client",
              amount: payment.amount,
            }
          : null,
        // payment.nextPaymentDate
        //   ? {
        //       type: "Next Payment Date",
        //       date: payment.nextPaymentDate,
        //       source: "Payment",
        //       entityId: payment.id,
        //       entityName: payment.client?.name || "Unknown Client",
        //       amount: payment.amount,
        //     }
        //   : null,
      ])
      .filter((date) => date !== null);

    // Extract dates from historic entries
    // const historicDates = historicEntries
    //   .filter((entry) => entry.createdAt)
    //   .map((entry) => ({
    //     type: "Activity Date",
    //     date: entry.createdAt,
    //     source: "Historic",
    //     entityId: entry.id,
    //     entityName: entry.description,
    //   }));

    // Combine and sort all dates (most recent first)
    // const allDates = [...clientDates, ...paymentDates, ...historicDates].sort(
    //   (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    // );

    const allDates = [...clientDates, ...paymentDates].sort(
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
