import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET: Fetch a specific user by ID
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
        location: true,
        subscriptionType: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        createdAt: true,
        clientRegistrationCount: true, // Include new field
        maxClientRegistrations: true, // Include new field
        paymentCount: true, // Include new field
        maxPayments: true, // Include new field
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

// PATCH: Update a specific user by ID
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

  // Validate required fields
  const allowedFields = [
    "email",
    "phone",
    "role",
    "location",
    "subscriptionType",
    "subscriptionStartDate",
    "subscriptionEndDate",
    "clientRegistrationCount", // Allow updating count
    "maxClientRegistrations", // Allow updating max
    "paymentCount", // Allow updating count
    "maxPayments", // Allow updating max
  ];

  const updates: any = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (
        field === "subscriptionStartDate" ||
        field === "subscriptionEndDate"
      ) {
        // Convert YYYY-MM-DD to ISO-8601 DateTime if a date is provided
        if (body[field]) {
          updates[field] = new Date(body[field]).toISOString();
        }
      } else if (
        [
          "clientRegistrationCount",
          "maxClientRegistrations",
          "paymentCount",
          "maxPayments",
        ].includes(field)
      ) {
        // Ensure counts and max values are integers and non-negative
        const value = parseInt(body[field], 10);
        if (isNaN(value) || value < 0) {
          return NextResponse.json(
            { error: `${field} must be a non-negative integer` },
            { status: 400 }
          );
        }
        updates[field] = value;
      } else {
        updates[field] = body[field];
      }
    }
  }

  // If subscriptionType is updated, adjust max limits accordingly
  if (updates.subscriptionType) {
    switch (updates.subscriptionType) {
      case "free":
        updates.maxClientRegistrations = 5;
        updates.maxPayments = 21;
        break;
      case "premium":
        updates.maxClientRegistrations = 10;
        updates.maxPayments = 30;
        break;
      case "enterprise":
        updates.maxClientRegistrations = 100;
        updates.maxPayments = 50; // Adjustable based on enterprise plan
        break;
      default:
        return NextResponse.json(
          { error: "Invalid subscription type" },
          { status: 400 }
        );
    }
  }

  // Validate counts against max limits
  const currentUser = await prisma.user.findUnique({ where: { id } });
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const newClientCount =
    updates.clientRegistrationCount ?? currentUser.clientRegistrationCount;
  const newMaxClients =
    updates.maxClientRegistrations ?? currentUser.maxClientRegistrations;
  const newPaymentCount = updates.paymentCount ?? currentUser.paymentCount;
  const newMaxPayments = updates.maxPayments ?? currentUser.maxPayments;

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

  // Handle password separately if provided (you might want to hash it)
  if (body.password) {
    return NextResponse.json(
      { error: "Password updates not implemented in this example" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent email conflicts
    if (updates.email && updates.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: updates.email },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        location: true,
        subscriptionType: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        createdAt: true,
        clientRegistrationCount: true, // Include in response
        maxClientRegistrations: true, // Include in response
        paymentCount: true, // Include in response
        maxPayments: true, // Include in response
      },
    });

    // Log the update in Historic
    await prisma.historic.create({
      data: {
        action: "UPDATE",
        entityType: "USER",
        entityId: id,
        oldData: JSON.parse(JSON.stringify(user)),
        newData: JSON.parse(JSON.stringify(updatedUser)),
        changedBy: session.user.id,
        description: `User ${user.email} updated by superadmin`,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
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
      select: {
        id: true,
        email: true,
        clientRegistrationCount: true, // Include for logging
        maxClientRegistrations: true, // Include for logging
        paymentCount: true, // Include for logging
        maxPayments: true, // Include for logging
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete related records (cascade delete should be handled by Prisma if configured)
    await prisma.user.delete({ where: { id } });

    // Log the deletion in Historic
    await prisma.historic.create({
      data: {
        action: "DELETE",
        entityType: "USER",
        entityId: id,
        oldData: JSON.parse(JSON.stringify(user)),
        newData: null,
        changedBy: session.user.id,
        description: `User ${user.email} deleted by superadmin`,
      },
    });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Error deleting user" }, { status: 500 });
  }
}
