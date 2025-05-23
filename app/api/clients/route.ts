import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id || !session.user.companyId) {
    // Log unauthorized attempt to Historic
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "CLIENT",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: "unknown",
        companyId: session?.user?.companyId,
        description:
          "Unauthorized attempt to create a client: No session, user ID, or company ID",
      },
    });
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "CLIENT",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: session.user.id,
        companyId: session.user.companyId,
        description: "User not found",
      },
    });
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check client registration limit (currently only user limit)
  if (user.clientRegistrationCount >= user.maxClientRegistrations) {
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "CLIENT",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: session.user.id,
        companyId: session.user.companyId,
        description: `Limit of ${user.maxClientRegistrations} client registrations reached for ${user.subscriptionType} plan`,
      },
    });
    return NextResponse.json(
      {
        error: `Limit of ${user.maxClientRegistrations} client registrations reached for your ${user.subscriptionType} plan. Upgrade to increase limit.`,
      },
      { status: 403 }
    );
  }

  const { name, phone, email } = await request.json();

  if (!name) {
    // Log validation failure to Historic
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "CLIENT",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: session.user.id,
        companyId: session.user.companyId,
        description: "Failed to create client: Name is required",
      },
    });
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const client = await prisma.client.create({
      data: {
        name,
        phone,
        email,
        userId: session.user.id, // Still associate with the user
        companyId: session.user.companyId, // Associate with the company
      },
    });
    // Increment client registration count for the company
    await prisma.company.update({
      where: { id: session.user.companyId },
      data: { clientRegistrationCount: { increment: 1 } },
    });

    // Log successful client creation to Historic
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "CLIENT",
        entityId: client.id,
        clientId: client.id,
        oldData: null,
        newData: {
          name,
          phone,
          email,
          registrationDate: client.registrationDate,
        },
        changedBy: session.user.id,
        companyId: session.user.companyId,
        description: "Client created successfully",
      },
    });

    // Create a notification for the user
    await prisma.notification.create({
      data: {
        type: "CLIENT_REGISTERED",
        message: `${name} has registered today`,
        userId: session.user.id,
        companyId: session.user.companyId,
        clientId: client.id,
      },
    });

    return NextResponse.json({ message: "Client registered", client });
  } catch (error) {
    console.error("Client creation error:", error);

    // Log error to Historic
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "CLIENT",
        entityId: "unknown",
        oldData: null,
        newData: null,
        changedBy: session.user.id,
        companyId: session.user.companyId,
        description: `Error creating client: ${
          error.message || "Unknown error"
        }`,
      },
    });

    return NextResponse.json(
      { error: error.message || "Error registering client" },
      { status: 400 }
    );
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id || !session.user.companyId) {
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }

  try {
    const clients = await prisma.client.findMany({
      where: { companyId: session.user.companyId }, // Fetch clients by companyId
      include: { user: true, payments: true },
    });
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching clients" },
      { status: 500 }
    );
  }
}
