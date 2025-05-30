/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  // Step 1: Verify the session and user role
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 2: Check if the user is a superadmin
  const userRole =
    (session.user as any).role || (session.user as any).isSuperAdmin;
  if (!["superadmin", true].includes(userRole)) {
    return NextResponse.json(
      { error: "Forbidden: Only superadmins can access this endpoint" },
      { status: 403 }
    );
  }

  try {
    // Step 3: Fetch all companies from the database
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        subscriptionType: true,
        subscriptionStartDate: true,
        clientRegistrationCount: true,
        paymentCount: true,
        subscriptionEndDate: true,
        maxClientRegistrations: true,
        maxPayments: true,
        createdAt: true,
      },
    });

    return NextResponse.json(companies, { status: 200 });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
