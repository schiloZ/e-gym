import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.companyId) {
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { client: { companyId: session.user.companyId } }, // Notifications linked to clients in the company
          { payment: { companyId: session.user.companyId } }, // Notifications linked to payments in the company
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true } },
        payment: { select: { amount: true } },
      },
    });
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Error fetching notifications" },
      { status: 500 }
    );
  }
}
