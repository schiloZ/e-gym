import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop(); // Extracts the ID from the path
  console.log("API PATCH /api/notifications/[id]/read called with id:", id);

  const session = await getServerSession(authOptions);

  if (
    !session ||
    typeof session !== "object" ||
    !("user" in session) ||
    !session.user ||
    !(session.user as any).id ||
    !(session.user as any).companyId
  ) {
    console.log("Unauthorized: No session, user ID, or company ID");
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }

  const companyId = (session.user as any).companyId;
  const notificationId = id;

  if (!notificationId || typeof notificationId !== "string") {
    console.log("Invalid notificationId format:", notificationId);
    return NextResponse.json(
      { error: "Invalid notification ID format" },
      { status: 400 }
    );
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        client: true,
        payment: true,
      },
    });

    if (!notification) {
      console.log("Notification not found for id:", notificationId);
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Verify the notification is related to the authenticated user's company
    const isRelatedToCompany =
      (notification.client && notification.client.companyId === companyId) ||
      (notification.payment && notification.payment.companyId === companyId);
    if (!isRelatedToCompany) {
      console.log(
        "Notification does not belong to company. Notification client companyId:",
        notification.client?.companyId,
        "Notification payment companyId:",
        notification.payment?.companyId,
        "Authenticated user's companyId:",
        companyId
      );
      return NextResponse.json(
        {
          error:
            "Notification does not belong to the authenticated user's company",
        },
        { status: 403 }
      );
    }

    if (notification.isRead) {
      console.log("Notification already marked as read:", notificationId);
      return NextResponse.json(
        { message: "Notification already marked as read" },
        { status: 200 }
      );
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json({
      message: "Notification marked as read",
      notification: {
        id: updatedNotification.id,
        isRead: updatedNotification.isRead,
      },
    });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: error.message || "Error marking notification as read" },
      { status: 500 }
    );
  }
}
