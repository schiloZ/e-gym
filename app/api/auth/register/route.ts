import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  const { email, phone, password } = await request.json(); // Destructure email, phone, and password from request body

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  } // Validate email and password

  // Check if the user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  } // If user exists, return an error

  // Hash the password
  // Use bcrypt to hash the password with a salt rounds of 10
  // This is a common practice to enhance security
  // The hashed password will be stored in the database

  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    await prisma.user.create({
      data: {
        email,
        phone: phone || null, // Handle optional phone number
        password: hashedPassword,
      },
    }); // Create a new user in the database

    // Return a success response
    return NextResponse.json({ message: "User registered" });
  } catch (error) {
    return NextResponse.json(console.error(error), { status: 400 });
  }
}
