/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const registrations = await prisma.client.findMany({
      where: { companyId: (session.user as any).companyId },
      select: { registrationDate: true },
    });

    const groupedByDate: { [key: string]: number } = {};

    registrations.forEach((client) => {
      if (client.registrationDate) {
        const dateStr = new Date(client.registrationDate)
          .toISOString()
          .split("T")[0];
        groupedByDate[dateStr] = (groupedByDate[dateStr] || 0) + 1;
      }
    });

    const data = Object.entries(groupedByDate)
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching registrations per day:", error);
    return NextResponse.json(
      { error: "Error fetching registrations per day" },
      { status: 500 }
    );
  }
}
