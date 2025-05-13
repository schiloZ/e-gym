import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(
    "API PATCH /api/notifications/[id]/read called with id:",
    params.id
  );

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    console.log("Unauthorized: No session or user ID");
    return NextResponse.json(
      { error: "Unauthorized: User not authenticated" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const notificationId = params.id;

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
    });

    if (!notification) {
      console.log("Notification not found for id:", notificationId);
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.userId !== userId) {
      console.log(
        "Notification does not belong to user. Notification userId:",
        notification.userId,
        "Authenticated userId:",
        userId
      );
      return NextResponse.json(
        { error: "Notification does not belong to the authenticated user" },
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
