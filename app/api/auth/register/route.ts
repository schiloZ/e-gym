import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

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
    // Ensure end date is after start date if both are provided
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
      return NextResponse.json({
        message: "SuperAdmin registered",
        superAdmin,
      });
    } else {
      // Handle company creation or linking
      let companyId: string | null = null;

      // If companyName is provided, create or find the company first
      if (companyName && companyName.trim()) {
        // Check if a company with this name already exists
        const existingCompany = await prisma.company.findFirst({
          where: { name: companyName },
        });

        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          // Set subscription limits based on subscriptionType
          const effectiveSubscriptionType = subscriptionType || "free";
          let maxClientRegistrations = 5; // Default for free
          let maxPayments = 20; // Default for free
          let effectiveStartDate = parsedStartDate || new Date();
          let effectiveEndDate = parsedEndDate;

          if (effectiveSubscriptionType === "free") {
            maxClientRegistrations = 5;
            maxPayments = 20;
            // Set end date to 21 days from start date if not provided
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

          // Create a new company with the limits and subscription details
          const newCompany = await prisma.company.create({
            data: {
              name: companyName,
              location: location || null,
              subscriptionType: effectiveSubscriptionType,
              subscriptionStartDate: effectiveStartDate,
              subscriptionEndDate: effectiveEndDate || null,
              maxClientRegistrations,
              maxPayments,
              clientRegistrationCount: 0, // Initialize count
              paymentCount: 0, // Initialize count
              createdAt: new Date(),
            },
          });
          companyId = newCompany.id;
        }
      } else {
        return NextResponse.json(
          { error: "companyName is required for manager or coach role" },
          { status: 400 }
        );
      }

      // Create the user with the retrieved companyId
      const user = await prisma.user.create({
        data: {
          email,
          phone: phone || null,
          password: hashedPassword,
          role: role.toLowerCase(),
          companyId: companyId, // Associate the companyId
          createdAt: new Date(),
        },
      });

      return NextResponse.json({ message: "User registered", user });
    }
  } catch (error) {
    console.error("Error during registration:", error);
    return NextResponse.json(
      { error: "Error registering user" },
      { status: 500 }
    );
  }
}
