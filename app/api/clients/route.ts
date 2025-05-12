import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  console.log(session);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, phone, email } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const client = await prisma.client.create({
      data: { name, phone, email, userId: session.user.id },
    });
    return NextResponse.json({ message: "Client registered", client });
  } catch (error: any) {
    console.error("Client creation error:", error);
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
