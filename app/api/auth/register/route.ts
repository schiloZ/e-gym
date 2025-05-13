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
      // Create a User (including manager or admin roles)

      const user = await prisma.user.create({
        data: {
          email,
          phone: phone || null,
          password: hashedPassword,
          role: role.toLowerCase(),
          companyName: companyName || null,
          location: location || null,
          subscriptionType: subscriptionType || "free",
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
