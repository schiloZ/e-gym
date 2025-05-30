import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Resend } from "resend";
// import twilio from "twilio";

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// // Initialize Twilio client with credentials from environment variables
// const twilioClient = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

export async function POST(request: Request) {
  const {
    email,
    phone,
    password,
    role,
    companyName,
    location,
    subscriptionType,
    subscriptionStartDate,
    subscriptionEndDate,
  } = await request.json();

  // Validate required fields
  if (!email || !password || !role) {
    return NextResponse.json(
      { error: "Email, password, and role are required" },
      { status: 400 }
    );
  }

  // Check if the email already exists (for both User and SuperAdmin)
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const existingSuperAdmin = await prisma.superAdmin.findUnique({
    where: { email },
  });
  if (existingUser || existingSuperAdmin) {
    return NextResponse.json(
      { error: "Email already exists" },
      { status: 400 }
    );
  }

  // Validate role
  const validRoles = ["manager", "coach", "superadmin"];
  if (!validRoles.includes(role.toLowerCase())) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Validate phone number if provided
  if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone)) {
    return NextResponse.json(
      { error: "Please enter a valid phone number (e.g., +1234567890)" },
      { status: 400 }
    );
  }

  // Validate subscription dates if provided
  let parsedStartDate = null;
  let parsedEndDate = null;
  if (subscriptionStartDate) {
    parsedStartDate = new Date(subscriptionStartDate);
    if (isNaN(parsedStartDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid subscription start date" },
        { status: 400 }
      );
    }
  }
  if (subscriptionEndDate) {
    parsedEndDate = new Date(subscriptionEndDate);
    if (isNaN(parsedEndDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid subscription end date" },
        { status: 400 }
      );
    }
    if (parsedStartDate && parsedEndDate <= parsedStartDate) {
      return NextResponse.json(
        { error: "Subscription end date must be after start date" },
        { status: 400 }
      );
    }
  }

  // Hash the password
  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    let userData;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let companyData: any = {
      subscriptionType: "",
      subscriptionStartDate: new Date(),
      subscriptionEndDate: null,
      maxClientRegistrations: 0,
      maxPayments: 0,
    };

    if (role.toLowerCase() === "superadmin") {
      // Create a SuperAdmin
      const superAdmin = await prisma.superAdmin.create({
        data: {
          email,
          phone: phone || null,
          password: hashedPassword,
          createdAt: new Date(),
        },
      });
      userData = superAdmin;
    } else {
      // Handle company creation or linking
      let companyId: string | null = null;

      if (companyName && companyName.trim()) {
        const existingCompany = await prisma.company.findFirst({
          where: { name: companyName },
        });

        if (existingCompany) {
          companyId = existingCompany.id;
          companyData = existingCompany;
        } else {
          const effectiveSubscriptionType = subscriptionType || "free";
          let maxClientRegistrations = 5;
          let maxPayments = 20;
          const effectiveStartDate = parsedStartDate || new Date();
          let effectiveEndDate = parsedEndDate;

          if (effectiveSubscriptionType === "free") {
            maxClientRegistrations = 5;
            maxPayments = 20;
            if (!parsedEndDate) {
              effectiveEndDate = new Date(effectiveStartDate);
              effectiveEndDate.setDate(effectiveStartDate.getDate() + 21);
            }
          } else if (effectiveSubscriptionType === "premium") {
            maxClientRegistrations = 50;
            maxPayments = 100;
          } else if (effectiveSubscriptionType === "enterprise") {
            maxClientRegistrations = 300;
            maxPayments = 1000;
          }

          const newCompany = await prisma.company.create({
            data: {
              name: companyName,
              location: location || null,
              subscriptionType: effectiveSubscriptionType,
              subscriptionStartDate: effectiveStartDate,
              subscriptionEndDate: effectiveEndDate || null,
              maxClientRegistrations,
              maxPayments,
              clientRegistrationCount: 0,
              paymentCount: 0,
              createdAt: new Date(),
            },
          });
          companyId = newCompany.id;
          companyData = newCompany;
        }
      } else {
        return NextResponse.json(
          { error: "companyName is required for manager or coach role" },
          { status: 400 }
        );
      }

      const user = await prisma.user.create({
        data: {
          email,
          phone: phone || null,
          password: hashedPassword,
          role: role.toLowerCase(),
          companyId: companyId,
          createdAt: new Date(),
        },
      });
      userData = user;
    }

    // Send the receipt email
    try {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1a73e8; text-align: center;">Welcome to E-Gym!</h2>
          <p style="color: #333; font-size: 16px;">Dear ${email},</p>
          <p style="color: #333; font-size: 16px;">Your account has been successfully created on ${new Date().toLocaleString()}. Below are your account details:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Email</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Phone</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${phone || "Not provided"}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Role</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${role.charAt(0).toUpperCase() + role.slice(1)}</td>
            </tr>
            ${
              role.toLowerCase() !== "superadmin" && companyData
                ? `
            <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Company Name</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${companyName}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Subscription Type</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${(companyData.subscriptionType || "").charAt(0).toUpperCase() + (companyData.subscriptionType || "").slice(1)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Subscription Start Date</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${companyData.subscriptionStartDate.toLocaleDateString()}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Subscription End Date</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${companyData.subscriptionEndDate ? companyData.subscriptionEndDate.toLocaleDateString() : "Not set"}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Max Client Registrations</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${companyData.maxClientRegistrations}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Max Payments</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${companyData.maxPayments}</td>
            </tr>
            `
                : ""
            }
          </table>

          <p style="color: #333; font-size: 16px;">You can now log in to your account and start managing your gym. Visit our website to get started:</p>
          <p style="text-align: center;">
            <a href="${
              process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
            }/login" style="display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: #fff; text-decoration: none; border-radius: 5px;">Log In Now</a>
          </p>

          <p style="color: #333; font-size: 16px;">If you have any questions, feel free to contact our support team.</p>
          <p style="color: #333; font-size: 16px;">Best regards,<br />The E-Gym Team</p>
          
          <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px; text-align: center;">E-Gym © ${new Date().getFullYear()}. All rights reserved.</p>
        </div>
      `;

      const emailResponse = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Welcome to E-Gym - Your Account Receipt",
        html: emailContent,
      });

      console.log("Email sent successfully:", emailResponse);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
    }

    return NextResponse.json({
      message:
        role.toLowerCase() === "superadmin"
          ? "SuperAdmin registered"
          : "User registered",
      user: userData,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return NextResponse.json(
      { error: "Error registering user" },
      { status: 500 }
    );
  }
}
