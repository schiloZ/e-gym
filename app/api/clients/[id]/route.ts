import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log("API GET /api/clients/[id] called with clientId:", params.id);

  // Get the session
  const session = await getServerSession(authOptions);

  // Check if the user is authenticated
  if (!session || !session.user || !session.user.id) {
    console.log("Unauthorized: No session or user ID");
    return NextResponse.json(
      { error: "Unauthorized: User not authenticated" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const clientId = params.id;

  // Validate clientId as a MongoDB ObjectId
  if (!ObjectId.isValid(clientId)) {
    console.log("Invalid clientId format:", clientId);
    return NextResponse.json(
      { error: "Invalid client ID format" },
      { status: 400 }
    );
  }

  try {
    // Fetch the client and their payments
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
      },
      include: {
        payments: {
          orderBy: {
            date: "desc", // Sort payments by most recent
          },
        },
        user: true, // Include the user to verify ownership
      },
    });

    if (!client) {
      console.log("Client not found for clientId:", clientId);
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify the client belongs to the authenticated user
    if (client.userId !== userId) {
      console.log(
        "Client does not belong to user. Client userId:",
        client.userId,
        "Authenticated userId:",
        userId
      );
      return NextResponse.json(
        { error: "Client does not belong to the authenticated user" },
        { status: 403 }
      );
    }
    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Error fetching client data" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log("API DELETE /api/clients/[id] called with clientId:", params.id);

  // Get the session
  const session = await getServerSession(authOptions);

  // Check if the user is authenticated
  if (!session || !session.user || !session.user.id) {
    console.log("Unauthorized: No session or user ID");
    return NextResponse.json(
      { error: "Unauthorized: User not authenticated" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const clientId = params.id;

  // Validate clientId as a MongoDB ObjectId
  if (!ObjectId.isValid(clientId)) {
    console.log("Invalid clientId format:", clientId);
    return NextResponse.json(
      { error: "Invalid client ID format" },
      { status: 400 }
    );
  }

  try {
    // Fetch the client to verify ownership
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
      },
    });

    if (!client) {
      console.log("Client not found for clientId:", clientId);
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify the client belongs to the authenticated user
    if (client.userId !== userId) {
      console.log(
        "Client does not belong to user. Client userId:",
        client.userId,
        "Authenticated userId:",
        userId
      );
      return NextResponse.json(
        { error: "Client does not belong to the authenticated user" },
        { status: 403 }
      );
    }

    // Delete the client (and associated payments due to cascading, if configured)
    await prisma.client.delete({
      where: {
        id: clientId,
      },
    });

    console.log("Client deleted successfully:", clientId);
    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Error deleting client" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(
    "API PATCH /api/clients/[clientId] called with clientId:",
    params.id
  );

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    console.log("Unauthorized: No session or user ID");
    await prisma.historic.create({
      data: {
        action: "UPDATE",
        entityType: "CLIENT",
        entityId: params.clientId,
        oldData: null,
        newData: null,
        changedBy: "unknown",
        description: "Unauthorized attempt to update client",
      },
    });
    return NextResponse.json(
      { error: "Unauthorized: User not authenticated" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const clientId = params.id;

  if (!ObjectId.isValid(clientId)) {
    console.log("Invalid clientId format:", clientId);
    await prisma.historic.create({
      data: {
        action: "UPDATE",
        entityType: "CLIENT",
        entityId: clientId,
        oldData: null,
        newData: null,
        changedBy: userId,
        description: "Invalid client ID format",
      },
    });
    return NextResponse.json(
      { error: "Invalid client ID format" },
      { status: 400 }
    );
  }

  try {
    const { name, email, phone, registrationDate } = await request.json();

    if (!name || !email) {
      await prisma.historic.create({
        data: {
          action: "UPDATE",
          entityType: "CLIENT",
          entityId: clientId,
          oldData: null,
          newData: null,
          changedBy: userId,
          description: "Name and email are required for update",
        },
      });
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await prisma.historic.create({
        data: {
          action: "UPDATE",
          entityType: "CLIENT",
          entityId: clientId,
          oldData: null,
          newData: null,
          changedBy: userId,
          description: "Invalid email format",
        },
      });
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (phone && !/^\+?[1-9]\d{9,14}$/.test(phone)) {
      await prisma.historic.create({
        data: {
          action: "UPDATE",
          entityType: "CLIENT",
          entityId: clientId,
          oldData: null,
          newData: null,
          changedBy: userId,
          description: "Invalid phone number format",
        },
      });
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    let parsedRegistrationDate = registrationDate
      ? new Date(registrationDate)
      : undefined;
    if (registrationDate && isNaN(parsedRegistrationDate.getTime())) {
      await prisma.historic.create({
        data: {
          action: "UPDATE",
          entityType: "CLIENT",
          entityId: clientId,
          oldData: null,
          newData: null,
          changedBy: userId,
          description: "Invalid registration date format",
        },
      });
      return NextResponse.json(
        { error: "Invalid registration date format" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      console.log("Client not found for clientId:", clientId);
      await prisma.historic.create({
        data: {
          action: "UPDATE",
          entityType: "CLIENT",
          entityId: clientId,
          oldData: null,
          newData: null,
          changedBy: userId,
          description: "Client not found",
        },
      });
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (client.userId !== userId) {
      console.log(
        "Client does not belong to user. Client userId:",
        client.userId,
        "Authenticated userId:",
        userId
      );
      await prisma.historic.create({
        data: {
          action: "UPDATE",
          entityType: "CLIENT",
          entityId: clientId,
          oldData: null,
          newData: null,
          changedBy: userId,
          description: "Client does not belong to the authenticated user",
        },
      });
      return NextResponse.json(
        { error: "Client does not belong to the authenticated user" },
        { status: 403 }
      );
    }

    const oldData = {
      name: client.name,
      email: client.email,
      phone: client.phone,
      registrationDate: client.registrationDate.toISOString(),
    };

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        name,
        email,
        phone,
        registrationDate: parsedRegistrationDate || client.registrationDate,
      },
    });

    const newData = {
      name,
      email,
      phone,
      registrationDate: parsedRegistrationDate
        ? parsedRegistrationDate.toISOString()
        : client.registrationDate.toISOString(),
    };

    await prisma.historic.create({
      data: {
        action: "UPDATE",
        entityType: "CLIENT",
        entityId: clientId,
        clientId: clientId, // Link to the client
        oldData,
        newData,
        changedBy: userId,
        description: "Client updated successfully",
      },
    });

    console.log("Client updated successfully:", updatedClient);
    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    await prisma.historic.create({
      data: {
        action: "UPDATE",
        entityType: "CLIENT",
        entityId: clientId,
        oldData: null,
        newData: null,
        changedBy: userId,
        description: `Error updating client: ${
          error.message || "Unknown error"
        }`,
      },
    });
    return NextResponse.json(
      { error: error.message || "Error updating client data" },
      { status: 500 }
    );
  }
}
