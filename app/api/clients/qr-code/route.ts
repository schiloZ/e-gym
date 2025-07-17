// app/api/client/register/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Use app password for Gmail
  },
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Registering client with data:", data);

    // Validate required fields
    if (!data.name || !data.phone || !data.gymId) {
      return NextResponse.json(
        { error: "Name, phone, and gymId are required" },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: data.gymId },
      select: { name: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Prepare client data
    const clientData: any = {
      name: data.name,
      phone: data.phone,
      company: {
        connect: { id: data.gymId },
      },
      registrationDate: new Date(data.registrationDate || new Date()),
    };

    // Add optional fields if they exist
    if (data.email) clientData.email = data.email;
    if (data.age) clientData.age = parseInt(data.age);
    if (data.fitnessGoal) clientData.fitnessGoal = data.fitnessGoal;
    if (data.height) clientData.height = parseFloat(data.height);
    if (data.weight) clientData.weight = parseFloat(data.weight);
    if (data.medicalConditions)
      clientData.medicalConditions = data.medicalConditions;
    if (data.allergies) clientData.allergies = data.allergies;
    if (data.injuries) clientData.injuries = data.injuries;
    if (data.medications) clientData.medications = data.medications;

    // Create new client
    const client = await prisma.client.create({
      data: clientData,
      include: {
        company: true,
      },
    });

    // Create historic record
    await prisma.historic.create({
      data: {
        action: "CREATE",
        entityType: "CLIENT",
        entityId: client.id,
        oldData: null,
        newData: {
          name: client.name,
          phone: client.phone,
          email: client.email,
          registrationDate: client.registrationDate,
        },
        companyId: data.gymId,
        description: "New client registered",
      },
    });

    // Prepare email content
    const emailDetails = {
      companyName: company.name,
      clientName: client.name,
      phone: client.phone,
      email: client.email || "Non fourni",
      registrationDate: new Date(client.registrationDate).toLocaleDateString(
        "fr-FR"
      ),
      fitnessGoal: client.fitnessGoal || "Non spécifié",
    };

    // Send email to company users (MANDATORY)
    const companyUsers = await prisma.user.findMany({
      where: { companyId: data.gymId },
      select: { email: true },
    });

    if (companyUsers.length > 0) {
      const companyEmailPromises = companyUsers.map((user) => {
        return transporter.sendMail({
          from: `"${emailDetails.companyName}" <${process.env.EMAIL_FROM}>`,
          to: user.email,
          subject: "Nouvel inscrit enregistré",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #2c3e50;">Nouvel inscrit enregistré</h1>
              </div>
              
              <div style="margin-bottom: 25px;">
                <p>Bonjour cher gestionnaire,</p>
                <p>Un nouvel inscrit a été ajouté à votre système.</p>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 25px;">
                <h3 style="color: #2c3e50; margin-top: 0;">Détails du client</h3>
                <p><strong>Nom:</strong> ${emailDetails.clientName}</p>
                <p><strong>Téléphone:</strong> ${emailDetails.phone}</p>
                <p><strong>Email:</strong> ${emailDetails.email}</p>
                <p><strong>Date d'inscription:</strong> ${emailDetails.registrationDate}</p>
                <p><strong>Objectif fitness:</strong> ${emailDetails.fitnessGoal}</p>
              </div>
              
              <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
                <p>Cordialement,</p>
                <p><strong>L'équipe E-GYM</strong></p>
              </div>
            </div>
          `,
        });
      });

      await Promise.all(companyEmailPromises);
      console.log("Emails sent to company users");
    } else {
      console.warn("No company users found to send registration notification");
    }

    // Send email to client if email exists (OPTIONAL)
    if (client.email) {
      await transporter.sendMail({
        from: `"${emailDetails.companyName}" <${process.env.EMAIL_FROM}>`,
        to: client.email,
        subject: "Bienvenue chez nous !",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #2c3e50;">Bienvenue chez ${emailDetails.companyName} !</h1>
            </div>
            
            <div style="margin-bottom: 25px;">
              <p>Bonjour ${emailDetails.clientName},</p>
              <p>Nous sommes ravis de vous accueillir parmi nous. Votre inscription a été enregistrée avec succès.</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 25px;">
              <h3 style="color: #2c3e50; margin-top: 0;">Détails de votre inscription</h3>
              <p><strong>Nom:</strong> ${emailDetails.clientName}</p>
              <p><strong>Téléphone:</strong> ${emailDetails.phone}</p>
              <p><strong>Date d'inscription:</strong> ${emailDetails.registrationDate}</p>
              <p><strong>Objectif fitness:</strong> ${emailDetails.fitnessGoal}</p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <p>Nous sommes impatients de vous accompagner dans votre parcours fitness.</p>
              <p>Pour toute question, n'hésitez pas à nous contacter.</p>
            </div>
            
            <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
              <p>Cordialement,</p>
              <p><strong>L'équipe ${emailDetails.companyName}</strong></p>
            </div>
          </div>
        `,
      });
      console.log("Welcome email sent to client");
    }

    return NextResponse.json({
      success: true,
      clientId: client.id,
      client: client,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        error: "Error registering client",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get("gym");
    console.log("Fetching clients for gymId:", gymId);

    if (!gymId) {
      return NextResponse.json({ error: "gymId is required" }, { status: 400 });
    }

    // Fetch clients for the specified gym
    const clients = await prisma.client.findMany({
      where: { companyId: gymId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        age: true,
        fitnessGoal: true,
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Error fetching clients" },
      { status: 500 }
    );
  }
}
