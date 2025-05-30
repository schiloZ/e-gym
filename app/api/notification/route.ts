import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { formatDistanceToNow } from "date-fns";

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
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { client: { companyId } }, // Notifications linked to clients in the company
          { payment: { companyId } }, // Notifications linked to payments in the company
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5, // Limit to 5 recent notifications for the dropdown
      include: {
        client: { select: { name: true } },
        payment: { select: { amount: true } },
      },
    });

    const formattedNotifications = notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
      }),
      clientName: notification.client?.name || null,
      paymentAmount: notification.payment?.amount || null,
    }));

    return NextResponse.json(formattedNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Error fetching notifications" },
      { status: 500 }
    );
  }
}
