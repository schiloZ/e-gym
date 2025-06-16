import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { ObjectId } from "mongodb";
import prisma from "@/lib/prisma";

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

  const userId = (session.user as any).id;
  const companyId = (session.user as any).companyId;

  if (!ObjectId.isValid(userId)) {
    return NextResponse.json(
      { error: "Invalid user ID format" },
      { status: 400 }
    );
  }

  try {
    const currentDate = new Date();

    const overduePayments = await prisma.payment.findMany({
      where: {
        companyId,
        subscription: {
          not: "Daily",
        },
        endDate: {
          not: null,
          lt: currentDate,
        },
      },
      include: {
        client: {
          include: { user: true },
        },
      },
      orderBy: {
        endDate: "desc",
      },
    });

    const overdueClientNames = overduePayments.map((payment: any) => {
      const endDate = new Date(payment.endDate);
      const timeDiff = currentDate.getTime() - endDate.getTime();
      const daysOverdue = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

      return {
        endDate: payment.endDate,
        clientName: payment.client.name, // Adjust field if different
        daysOverdue, // Add number of days overdue
      };
    });

    return NextResponse.json(overdueClientNames);
  } catch (error: any) {
    console.error("Error fetching overdue clients:", error);
    return NextResponse.json(
      { error: "Error fetching overdue clients" },
      { status: 500 }
    );
  }
}
