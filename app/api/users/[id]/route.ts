import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

// GET: Fetch a specific user by ID with associated company details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user?.role || session.user?.isSuperAdmin;
  if (!["superadmin", true].includes(userRole)) {
    return NextResponse.json(
      { error: "Forbidden: Only superadmins can access this endpoint" },
      { status: 403 }
    );
  }

  const { id } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        phone: true,
        role: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            subscriptionType: true,
            subscriptionStartDate: true,
            subscriptionEndDate: true,
            clientRegistrationCount: true,
            maxClientRegistrations: true,
            paymentCount: true,
            maxPayments: true,
          },
        },
        clients: {
          select: { id: true, name: true },
        },
        payments: {
          select: { id: true, amount: true, paymentDate: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Error fetching user" }, { status: 500 });
  }
}

// PATCH: Update a specific user by ID (including password and company details)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user?.role || session.user?.isSuperAdmin;
  if (!["superadmin", true].includes(userRole)) {
    return NextResponse.json(
      { error: "Forbidden: Only superadmins can update users" },
      { status: 403 }
    );
  }

  const id = params.id;
  const body = await request.json();

  // Validate and separate user and company updates
  const userUpdates: any = {};
  const companyUpdates: any = {};
  const allowedUserFields = ["email", "phone", "role", "password"];
  const allowedCompanyFields = [
    "subscriptionType",
    "subscriptionStartDate",
    "subscriptionEndDate",
    "clientRegistrationCount",
    "maxClientRegistrations",
    "paymentCount",
    "maxPayments",
  ];

  // Process user fields
  for (const field of allowedUserFields) {
    if (body[field] !== undefined) {
      if (field === "password") {
        // Hash the password if provided
        const saltRounds = 10;
        userUpdates[field] = await bcrypt.hash(body[field], saltRounds);
      } else {
        userUpdates[field] = body[field];
      }
    }
  }

  // Process company fields
  for (const field of allowedCompanyFields) {
    if (body[field] !== undefined) {
      if (
        field === "subscriptionStartDate" ||
        field === "subscriptionEndDate"
      ) {
        if (body[field]) {
          const date = new Date(body[field]);
          if (isNaN(date.getTime())) {
            return NextResponse.json(
              { error: `${field} must be a valid date` },
              { status: 400 }
            );
          }
          companyUpdates[field] = date.toISOString();
        }
      } else if (
        [
          "clientRegistrationCount",
          "maxClientRegistrations",
          "paymentCount",
          "maxPayments",
        ].includes(field)
      ) {
        const value = parseInt(body[field], 10);
        if (isNaN(value) || value < 0) {
          return NextResponse.json(
            { error: `${field} must be a non-negative integer` },
            { status: 400 }
          );
        }
        companyUpdates[field] = value;
      } else {
        companyUpdates[field] = body[field];
      }
    }
  }

  // If subscriptionType is updated, adjust max limits accordingly
  if (companyUpdates.subscriptionType) {
    switch (companyUpdates.subscriptionType) {
      case "free":
        companyUpdates.maxClientRegistrations = 5;
        companyUpdates.maxPayments = 20;
        break;
      case "premium":
        companyUpdates.maxClientRegistrations = 10;
        companyUpdates.maxPayments = 30;
        break;
      case "enterprise":
        companyUpdates.maxClientRegistrations = 100;
        companyUpdates.maxPayments = 50;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid subscription type" },
          { status: 400 }
        );
    }
  }

  // Fetch current user and company for validation
  const currentUser = await prisma.user.findUnique({
    where: { id },
    include: { company: true },
  });
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Validate counts against max limits
  const currentCompany = currentUser.company;
  if (!currentCompany) {
    return NextResponse.json(
      { error: "User is not associated with a company" },
      { status: 400 }
    );
  }

  const newClientCount =
    companyUpdates.clientRegistrationCount ??
    currentCompany.clientRegistrationCount;
  const newMaxClients =
    companyUpdates.maxClientRegistrations ??
    currentCompany.maxClientRegistrations;
  const newPaymentCount =
    companyUpdates.paymentCount ?? currentCompany.paymentCount;
  const newMaxPayments =
    companyUpdates.maxPayments ?? currentCompany.maxPayments;

  if (newClientCount > newMaxClients) {
    return NextResponse.json(
      {
        error: `Client registration count (${newClientCount}) cannot exceed max limit (${newMaxClients})`,
      },
      { status: 400 }
    );
  }

  if (newPaymentCount > newMaxPayments) {
    return NextResponse.json(
      {
        error: `Payment count (${newPaymentCount}) cannot exceed max limit (${newMaxPayments})`,
      },
      { status: 400 }
    );
  }

  try {
    // Begin transaction to update user and company atomically
    const [updatedUser] = await prisma.$transaction([
      // Update user if there are changes
      prisma.user.update({
        where: { id },
        data: userUpdates,
        select: {
          id: true,
          email: true,
          emailVerified: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      }),
      // Update company if there are changes
      ...(Object.keys(companyUpdates).length > 0
        ? [
            prisma.company.update({
              where: { id: currentUser.companyId },
              data: companyUpdates,
            }),
          ]
        : []),
      // Log the update in Historic
      prisma.historic.create({
        data: {
          action: "UPDATE",
          entityType: "USER",
          entityId: id,
          oldData: JSON.parse(
            JSON.stringify({ ...currentUser, company: currentCompany })
          ),
          newData: JSON.parse(
            JSON.stringify({
              ...currentUser,
              ...userUpdates,
              company: { ...currentCompany, ...companyUpdates },
            })
          ),
          changedBy: session.user.id,
          companyId: currentUser.companyId,
          description: `User ${currentUser.email} updated by superadmin`,
        },
      }),
    ]);

    // Fetch updated company details for response
    const updatedCompany = await prisma.company.findUnique({
      where: { id: currentUser.companyId },
      select: {
        id: true,
        name: true,
        subscriptionType: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        clientRegistrationCount: true,
        maxClientRegistrations: true,
        paymentCount: true,
        maxPayments: true,
      },
    });

    return NextResponse.json(
      { ...updatedUser, company: updatedCompany },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Error updating user" }, { status: 500 });
  }
}

// DELETE: Delete a specific user by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user?.role || session.user?.isSuperAdmin;
  if (!["superadmin", true].includes(userRole)) {
    return NextResponse.json(
      { error: "Forbidden: Only superadmins can delete users" },
      { status: 403 }
    );
  }

  const { id } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            subscriptionType: true,
            subscriptionStartDate: true,
            subscriptionEndDate: true,
            clientRegistrationCount: true,
            maxClientRegistrations: true,
            paymentCount: true,
            maxPayments: true,
          },
        },
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete the user (cascade delete should handle related records if configured in Prisma)
    await prisma.$transaction([
      prisma.user.delete({ where: { id } }),
      // Log the deletion in Historic
      prisma.historic.create({
        data: {
          action: "DELETE",
          entityType: "USER",
          entityId: id,
          oldData: JSON.parse(JSON.stringify(user)),
          newData: null,
          changedBy: session.user.id,
          companyId: user.companyId,
          description: `User ${user.email} deleted by superadmin`,
        },
      }),
    ]);

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Error deleting user" }, { status: 500 });
  }
}
