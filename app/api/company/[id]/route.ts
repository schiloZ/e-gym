import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop(); // Extracts the ID from the path
  console.log("API GET /api/company/[id] called with companyId:", id);
  // Step 1: Verify the session and user role
  const session = await getServerSession(authOptions);
  if (
    !session ||
    typeof session !== "object" ||
    !("user" in session) ||
    !session.user ||
    !(session.user as any).id ||
    !(session.user as any).companyId
  ) {
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
  const companyId = id;

  try {
    if (companyId) {
      // Step 3: Fetch a specific company with its users, clients, and payments
      const company = await prisma.company.findUnique({
        where: { id: companyId },
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
          updatedAt: true,
          users: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: true,
              createdAt: true,
            },
          },
          clients: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              registrationDate: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(company, { status: 200 });
    } else {
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
          payments: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      return NextResponse.json(companies, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop(); // Extracts the ID from the path
  console.log("API PATCH /api/company/[id] called with companyId:", id);
  // Step 1: Verify the session and user role
  const session = await getServerSession(authOptions);
  if (
    !session ||
    typeof session !== "object" ||
    !("user" in session) ||
    !session.user ||
    !(session.user as any).id ||
    !(session.user as any).companyId
  ) {
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

  const companyId = id;
  if (!companyId) {
    return NextResponse.json(
      { error: "Company ID is required" },
      { status: 400 }
    );
  }

  const {
    name,
    location,
    subscriptionType,
    subscriptionStartDate,
    subscriptionEndDate,
    clientRegistrationCount,
    paymentCount,
    maxClientRegistrations,
    maxPayments,
  } = await request.json();

  try {
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name,
        location,
        subscriptionType,
        subscriptionStartDate: subscriptionStartDate
          ? new Date(subscriptionStartDate)
          : undefined,
        subscriptionEndDate: subscriptionEndDate
          ? new Date(subscriptionEndDate)
          : undefined,
        clientRegistrationCount:
          clientRegistrationCount !== undefined
            ? parseInt(clientRegistrationCount, 10)
            : undefined,
        paymentCount:
          paymentCount !== undefined ? parseInt(paymentCount, 10) : undefined,
        maxClientRegistrations:
          maxClientRegistrations !== undefined
            ? parseInt(maxClientRegistrations, 10)
            : undefined,
        maxPayments:
          maxPayments !== undefined ? parseInt(maxPayments, 10) : undefined,
        updatedAt: new Date(),
      },
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
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedCompany, { status: 200 });
  } catch (error: any) {
    console.error("Error updating company:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop(); // Extracts the ID from the path
  console.log("API DELETE /api/company/[id] called with companyId:", id);
  // Step 1: Verify the session and user role
  const session = await getServerSession(authOptions);
  if (
    !session ||
    typeof session !== "object" ||
    !("user" in session) ||
    !session.user ||
    !(session.user as any).id ||
    !(session.user as any).companyId
  ) {
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

  const companyId = id;
  if (!companyId) {
    return NextResponse.json(
      { error: "Company ID is required" },
      { status: 400 }
    );
  }

  try {
    // Delete the company
    await prisma.company.delete({
      where: { id: companyId },
    });

    return NextResponse.json(
      { message: "Company deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting company:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
