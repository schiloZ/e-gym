import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

export async function GET() {
  // Step 1: Verify the session
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 2: Check if the user is a superadmin (superadmins may not have a company)
  const userRole =
    (session.user as any).role || (session.user as any).isSuperAdmin;
  if (userRole === "superadmin" || (session.user as any).isSuperAdmin) {
    return NextResponse.json(
      {
        subscriptionType: null,
        clientRegistrationCount: 0,
        maxClientRegistrations: 0,
      },
      { status: 200 }
    );
  }

  // Step 3: Get the companyId from the session
  const companyId = (session.user as any).companyId;
  if (!companyId) {
    return NextResponse.json(
      { error: "User is not associated with a company" },
      { status: 400 }
    );
  }

  try {
    // Step 4: Fetch the company details
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        subscriptionType: true,
        clientRegistrationCount: true,
        maxClientRegistrations: true,
        paymentCount: true,
        maxPayments: true,
        subscriptionEndDate: true,
        name: true,
        location: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company, { status: 200 });
  } catch (error) {
    console.error("Error fetching company details:", error);
    return NextResponse.json(
      { error: "Failed to fetch company details" },
      { status: 500 }
    );
  }
}
