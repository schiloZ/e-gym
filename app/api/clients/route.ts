import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  console.log(session);
  if (!session || !session.user?.id) {
    // Log unauthorized attempt to Historic
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "CLIENT",
        entityId: "unknown", // No client ID yet since creation failed
        oldData: null,
        newData: null,
        changedBy: "unknown",
        description: "Unauthorized attempt to create a client",
      },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        description: "Failed to create client: Name is required",
      },
    });
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const client = await prisma.client.create({
      data: { name, phone, email, userId: session.user.id },
    });

    // Log successful client creation to Historic
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "CLIENT",
        entityId: client.id,
        clientId: client.id, // Link to the client
        oldData: null, // No previous data for a new client
        newData: {
          name,
          phone,
          email,
          registrationDate: client.registrationDate,
        },
        changedBy: session.user.id,
        description: "Client created successfully",
      },
    });

    // Create a notification for the user
    await prisma.notification.create({
      data: {
        type: "CLIENT_REGISTERED",
        message: `${name} has registered today`,
        userId: session.user.id,
        clientId: client.id,
      },
    });

    return NextResponse.json({ message: "Client registered", client });
  } catch (error: any) {
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
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clients = await prisma.client.findMany({
      where: { userId: session.user.id },
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
