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
  const validRoles = ["user", "manager", "admin", "superadmin"];
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
          createdAt: new Date("2025-05-15T10:44:00.000Z"), // Current date/time
        },
      });
      return NextResponse.json({
        message: "SuperAdmin registered",
        superAdmin,
      });
    } else {
      // Handle company creation or linking
      let companyId = null;
      if (companyName) {
        // Check if a company with this name already exists
        let company = await prisma.company.findFirst({
          where: { name: companyName },
        });

        // If not, create a new company
        if (!company) {
          company = await prisma.company.create({
            data: {
              name: companyName,
              createdAt: new Date("2025-05-15T10:44:00.000Z"), // Current date/time
            },
          });
        }
        companyId = company.id;
      }

      // Create a User (including manager or admin roles)
      const user = await prisma.user.create({
        data: {
          email,
          phone: phone || null,
          password: hashedPassword,
          role: role.toLowerCase(),
          companyId: companyId, // Link to the company if created
          location: location || null,
          subscriptionType: subscriptionType || "free",
          subscriptionStartDate: parsedStartDate || null,
          subscriptionEndDate: parsedEndDate || null,
          createdAt: new Date("2025-05-15T10:44:00.000Z"), // Current date/time
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
