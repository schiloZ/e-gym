import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
  // Step 1: Verify the session and user role
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 2: Check if the user is a superadmin
  const userRole = session.user?.role || session.user?.isSuperAdmin;
  if (!["superadmin", true].includes(userRole)) {
    return NextResponse.json(
      { error: "Forbidden: Only superadmins can access this endpoint" },
      { status: 403 }
    );
  }

  // Step 3: Fetch all users from the database
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        emailVerified: true,
        phone: true,
        role: true,
        location: true,
        subscriptionType: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        createdAt: true,
        // Include related data if needed (optional)
        clients: {
          select: {
            id: true,
            name: true, // Adjust based on your Client model
          },
        },
        payments: {
          select: {
            id: true,
            amount: true, // Adjust based on your Payment model
            paymentDate: true,
          },
        },
        // Exclude sensitive fields like password
      },
    });

    // Step 4: Return the users
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error fetching users" },
      { status: 500 }
    );
  }
}
