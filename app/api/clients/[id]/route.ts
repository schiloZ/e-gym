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

  // Check if the user is authenticated and has a companyId
  if (
    !session ||
    !session.user ||
    !session.user.id ||
    !session.user.companyId
  ) {
    console.log("Unauthorized: No session, user ID, or company ID");
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }

  const companyId = session.user.companyId;
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
        user: true, // Include the user for additional context if needed
      },
    });

    if (!client) {
      console.log("Client not found for clientId:", clientId);
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify the client belongs to the authenticated user's company
    if (client.companyId !== companyId) {
      console.log(
        "Client does not belong to company. Client companyId:",
        client.companyId,
        "Authenticated user's companyId:",
        companyId
      );
      return NextResponse.json(
        { error: "Client does not belong to the authenticated user's company" },
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

  // Check if the user is authenticated and has a companyId
  if (
    !session ||
    !session.user ||
    !session.user.id ||
    !session.user.companyId
  ) {
    console.log("Unauthorized: No session, user ID, or company ID");
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }

  const companyId = session.user.companyId;
  const clientId = params.id;

  // Validate clientId as a MongoDB ObjectId (though Prisma doesn't require ObjectId, keeping for consistency)
  if (!ObjectId.isValid(clientId)) {
    console.log("Invalid clientId format:", clientId);
    return NextResponse.json(
      { error: "Invalid client ID format" },
      { status: 400 }
    );
  }

  try {
    // Fetch the client to verify ownership and capture data for historic record
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
      },
    });

    if (!client) {
      console.log("Client not found for clientId:", clientId);
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify the client belongs to the authenticated user's company
    if (client.companyId !== companyId) {
      console.log(
        "Client does not belong to company. Client companyId:",
        client.companyId,
        "Authenticated user's companyId:",
        companyId
      );
      return NextResponse.json(
        { error: "Client does not belong to the authenticated user's company" },
        { status: 403 }
      );
    }

    // Capture the client's data before deletion for the historic record
    const oldData = {
      name: client.name,
      email: client.email,
      phone: client.phone,
      dateEnregistrement: client.registrationDate.toISOString(),
      taille: client.height,
      poids: client.weight,
      age: client.age,
      conditionMedical: client.medicalConditions,
      allergies: client.allergies,
      blessures: client.injuries,
      medications: client.medications,
      pressionSanguine: client.bloodPressure,
      poidsCiblé: client.targetWeight,
      objectifFitness: client.fitnessGoal,
      objectifGraisse: client.targetBodyFat,
    };

    // Delete the client (and associated payments due to cascading, if configured)
    await prisma.client.delete({
      where: {
        id: clientId,
      },
    });

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { subscriptionType: true },
    });
    if (company?.subscriptionType !== "free") {
      await prisma.historic.create({
        data: {
          action: "DELETE",
          entityType: "CLIENT",
          entityId: clientId,
          clientId: clientId, // Link to the client
          oldData, // Store the client's data before deletion
          newData: null, // No new data since this is a deletion
          changedBy: session.user.id,
          companyId: session.user.companyId,
          description: "Client deleted successfully",
        },
      });
    } else {
      console.log(
        "Client deleted, but historic record not created: Subscription type is 'free'"
      );
    }

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

  if (
    !session ||
    !session.user ||
    !session.user.id ||
    !session.user.companyId
  ) {
    console.log("Unauthorized: No session, user ID, or company ID");
    await prisma.historic.create({
      data: {
        action: "UPDATE",
        entityType: "CLIENT",
        entityId: params.id,
        oldData: null,
        newData: null,
        changedBy: "unknown",
        description: "Unauthorized attempt to update client",
      },
    });
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const companyId = session.user.companyId;
  const clientId = params.id;

  if (!ObjectId.isValid(clientId)) {
    console.log("Invalid clientId format:", clientId);
    return NextResponse.json(
      { error: "Invalid client ID format" },
      { status: 400 }
    );
  }

  try {
    const {
      name,
      email,
      phone,
      registrationDate,
      height,
      weight,
      age,
      medicalConditions,
      allergies,
      injuries,
      medications,
      bloodPressure,
      targetWeight,
      fitnessGoal,
      targetBodyFat,
      goalMilestone,
    } = await request.json();

    // Validation
    if (!name || !email) {
      console.log("Validation error: Name and email are required");
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
          companyId: session.user.companyId,
          description: "Invalid email format",
        },
      });
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (phone && !/^\+?[1-9]\d{9,14}$/.test(phone)) {
      console.log("Invalid phone number format:", phone);
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    let parsedRegistrationDate = registrationDate
      ? new Date(registrationDate)
      : undefined;
    if (registrationDate && isNaN(parsedRegistrationDate.getTime())) {
      console.log("Invalid registration date format:", registrationDate);
      return NextResponse.json(
        { error: "Invalid registration date format" },
        { status: 400 }
      );
    }

    // Validate medical and goal fields
    if (height && (height <= 0 || height > 300)) {
      return NextResponse.json(
        { error: "Height must be between 0 and 300 cm" },
        { status: 400 }
      );
    }
    if (weight && (weight <= 0 || weight > 500)) {
      return NextResponse.json(
        { error: "Weight must be between 0 and 500 kg" },
        { status: 400 }
      );
    }
    if (age && (age < 0 || age > 150)) {
      return NextResponse.json(
        { error: "Age must be between 0 and 150" },
        { status: 400 }
      );
    }
    if (bloodPressure && !/^\d{2,3}\/\d{2,3}$/.test(bloodPressure)) {
      return NextResponse.json(
        {
          error:
            "Blood pressure must be in the format 'systolic/diastolic' (e.g., '120/80')",
        },
        { status: 400 }
      );
    }
    if (targetWeight && (targetWeight <= 0 || targetWeight > 500)) {
      return NextResponse.json(
        { error: "Target weight must be between 0 and 500 kg" },
        { status: 400 }
      );
    }
    if (targetBodyFat && (targetBodyFat < 0 || targetBodyFat > 100)) {
      return NextResponse.json(
        { error: "Target body fat percentage must be between 0 and 100" },
        { status: 400 }
      );
    }
    if (
      fitnessGoal &&
      !["weight loss", "muscle gain", "endurance", "general fitness"].includes(
        fitnessGoal.toLowerCase()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Fitness goal must be one of: 'weight loss', 'muscle gain', 'endurance', 'general fitness'",
        },
        { status: 400 }
      );
    }

    let parsedGoalMilestone = goalMilestone
      ? new Date(goalMilestone)
      : undefined;
    if (goalMilestone && isNaN(parsedGoalMilestone.getTime())) {
      console.log("Invalid goal milestone date format:", goalMilestone);
      return NextResponse.json(
        { error: "Invalid goal milestone date format" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      console.log("Client not found for clientId:", clientId);
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify the client belongs to the authenticated user's company
    if (client.companyId !== companyId) {
      console.log(
        "Client does not belong to company. Client companyId:",
        client.companyId,
        "Authenticated user's companyId:",
        companyId
      );
      return NextResponse.json(
        { error: "Client does not belong to the authenticated user's company" },
        { status: 403 }
      );
    }

    const oldData = {
      name: client.name,
      email: client.email,
      phone: client.phone,
      dateEnregistrement: client.registrationDate.toISOString(),
      taille: client.height,
      poids: client.weight,
      age: client.age,
      conditionMedical: client.medicalConditions,
      allergies: client.allergies,
      blessures: client.injuries,
      medications: client.medications,
      pressionSanguine: client.bloodPressure,
      poidsCiblé: client.targetWeight,
      objectifFitness: client.fitnessGoal,
      objectifGraisse: client.targetBodyFat,
    };

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        name,
        email,
        phone,
        registrationDate: parsedRegistrationDate || client.registrationDate,
        height,
        weight,
        age,
        medicalConditions,
        allergies,
        injuries,
        medications,
        bloodPressure,
        targetWeight,
        fitnessGoal,
        targetBodyFat,
        goalMilestone: parsedGoalMilestone || client.goalMilestone,
      },
    });

    const newData = {
      name,
      email,
      phone,
      dateEnregistrement: parsedRegistrationDate
        ? parsedRegistrationDate.toISOString()
        : client.registrationDate.toISOString(),
      taille: height,
      poids: weight,
      age,
      conditionMedical: medicalConditions,
      allergies,
      blessures: injuries,
      medications,
      pressionSanguine: bloodPressure,
      poidsCiblé: targetWeight,
      objectifFitness: fitnessGoal,
      objectifGraisse: targetBodyFat,
      goalMilestone: parsedGoalMilestone
        ? parsedGoalMilestone.toISOString()
        : client.goalMilestone
          ? client.goalMilestone.toISOString()
          : null,
    };
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { subscriptionType: true },
    });
    if (company?.subscriptionType !== "free") {
      await prisma.historic.create({
        data: {
          action: "UPDATE",
          entityType: "CLIENT",
          entityId: clientId,
          clientId: clientId, // Link to the client
          oldData,
          newData,
          changedBy: userId,
          companyId: session.user.companyId,
          description: "Client updated successfully",
        },
      });
    } else {
      console.log(
        "Client updated, but historic record not created: Subscription type is 'free'"
      );
    }

    console.log("Client updated successfully:", updatedClient);
    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: error.message || "Error updating client data" },
      { status: 500 }
    );
  }
}
