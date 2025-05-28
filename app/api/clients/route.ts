import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import cloudinary from "cloudinary";

// Configure Cloudinary (you can also do this in a separate config file)
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id || !session.user.companyId) {
    console.error(
      "Unauthorized: User not authenticated or no company associated"
    );
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
    console.error("User not found");
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const height = formData.get("height") as string;
  const weight = formData.get("weight") as string;
  const age = formData.get("age") as string;
  const medicalConditions = formData.get("medicalConditions") as string;
  const allergies = formData.get("allergies") as string;
  const injuries = formData.get("injuries") as string;
  const medications = formData.get("medications") as string;
  const bloodPressure = formData.get("bloodPressure") as string;
  const targetWeight = formData.get("targetWeight") as string;
  const fitnessGoal = formData.get("fitnessGoal") as string;
  const targetBodyFat = formData.get("targetBodyFat") as string;
  const goalMilestone = formData.get("goalMilestone") as string;
  const imageFile = formData.get("image") as File | null;

  // Validation
  if (!name) {
    console.error("Name is required");
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Invalid email format");
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 }
    );
  }

  if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone)) {
    console.error("Invalid phone number format (e.g., +1234567890)");
    return NextResponse.json(
      { error: "Invalid phone number format (e.g., +1234567890)" },
      { status: 400 }
    );
  }

  if (height && (Number(height) <= 0 || Number(height) > 300)) {
    return NextResponse.json(
      { error: "Height must be between 0 and 300 cm" },
      { status: 400 }
    );
  }
  if (weight && (Number(weight) <= 0 || Number(weight) > 500)) {
    return NextResponse.json(
      { error: "Weight must be between 0 and 500 kg" },
      { status: 400 }
    );
  }
  if (age && (Number(age) < 0 || Number(age) > 150)) {
    return NextResponse.json(
      { error: "Age must be between 0 and 150" },
      { status: 400 }
    );
  }
  if (bloodPressure && !/^\d{2,3}\/\d{2,3}$/.test(bloodPressure)) {
    return NextResponse.json(
      {
        error:
          "Blood pressure must be in the format 'systolic/diastolique' (e.g., '120/80')",
      },
      { status: 400 }
    );
  }
  if (
    targetWeight &&
    (Number(targetWeight) <= 0 || Number(targetWeight) > 500)
  ) {
    return NextResponse.json(
      { error: "Target weight must be between 0 and 500 kg" },
      { status: 400 }
    );
  }
  if (
    targetBodyFat &&
    (Number(targetBodyFat) < 0 || Number(targetBodyFat) > 100)
  ) {
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

  // Upload image to Cloudinary if provided
  let imagePath = null;
  if (imageFile) {
    try {
      // Validate environment variables
      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        console.error("Missing Cloudinary credentials");
        return NextResponse.json(
          {
            error: "Server configuration error: Missing Cloudinary credentials",
          },
          { status: 500 }
        );
      }

      // Convert File to a Buffer (required for Cloudinary upload)
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload the image to Cloudinary
      console.log("Uploading image to Cloudinary...");
      const uploadResponse = await new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          {
            folder: "clients", // Optional: Store images in a "clients" folder in Cloudinary
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        stream.end(buffer);
      });

      imagePath = uploadResponse.secure_url; // Use secure URL for the image
      console.log("Image uploaded successfully. Image Path:", imagePath);
    } catch (error) {
      console.error("Failed to upload image to Cloudinary:", error.message);
      return NextResponse.json(
        { error: `Failed to upload image to Cloudinary: ${error.message}` },
        { status: 500 }
      );
    }
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { clientRegistrationCount: true, maxClientRegistrations: true },
  });

  if (
    company &&
    company.maxClientRegistrations &&
    company.clientRegistrationCount >= company.maxClientRegistrations
  ) {
    return NextResponse.json(
      {
        error:
          "Le Nombre d'enregistrements clients est atteint veuillez renouveler votre abonnement",
      },
      { status: 403 }
    );
  }
  try {
    const client = await prisma.client.create({
      data: {
        name,
        phone,
        email,
        imagePath, // Save the Cloudinary image URL
        userId: session.user.id,
        companyId: session.user.companyId,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        age: age ? Number(age) : undefined,
        medicalConditions,
        allergies,
        injuries,
        medications,
        bloodPressure,
        targetWeight: targetWeight ? Number(targetWeight) : undefined,
        fitnessGoal,
        targetBodyFat: targetBodyFat ? Number(targetBodyFat) : undefined,
        goalMilestone: goalMilestone ? new Date(goalMilestone) : undefined,
      },
    });

    await prisma.company.update({
      where: { id: session.user.companyId },
      data: { clientRegistrationCount: { increment: 1 } },
    });

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { subscriptionType: true },
    });
    if (company?.subscriptionType !== "free") {
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
            imagePath,
            registrationDate: client.registrationDate,
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
            goalMilestone: goalMilestone ? new Date(goalMilestone) : undefined,
          },
          changedBy: session.user.id,
          companyId: session.user.companyId,
          description: "Client created successfully",
        },
      });
    } else {
      console.log("Historic record not created: Subscription type is 'free'");
    }

    const notificationMessage = `${name} a été enregistré comme client ${
      fitnessGoal
        ? ` avec un objectif ${fitnessGoal === "weight loss" ? "de perte de poids" : fitnessGoal === "muscle gain" ? "de gain de masse musculaire" : fitnessGoal === "general fitness" ? "de fitness" : "endurance"}`
        : ""
    }`;
    await prisma.notification.create({
      data: {
        type: "CLIENT_REGISTERED",
        message: notificationMessage,
        userId: session.user.id,
        companyId: session.user.companyId,
        clientId: client.id,
      },
    });

    return NextResponse.json({ message: "Client registered", client });
  } catch (error) {
    console.error("Client creation error:", error);
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
      where: { companyId: session.user.companyId },
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
