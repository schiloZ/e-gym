import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions"; // Adjust path as needed
import prisma from "@/lib/prisma"; // Adjust path as needed

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop(); // Extracts the ID from the path
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole =
    (session.user as any).role || (session.user as any).isSuperAdmin;
  if (!["superadmin", true].includes(userRole)) {
    return NextResponse.json(
      { error: "Forbidden: Only superadmins can access this endpoint" },
      { status: 403 }
    );
  }

  if (!id) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }
  try {
    // Verify the user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Count clients
    const clientCount = await prisma.client.count({
      where: { userId: id },
    });

    // Count payments
    const paymentCount = await prisma.payment.count({
      where: { userId: id },
    });

    return NextResponse.json(
      {
        clientCount,
        paymentCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Error fetching user stats" },
      { status: 500 }
    );
  }
}
