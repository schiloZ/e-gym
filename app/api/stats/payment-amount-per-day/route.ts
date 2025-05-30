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
    // Fetch all payments for the user
    const payments = await prisma.payment.findMany({
      where: { companyId: (session.user as any).companyId },
      select: {
        date: true,
        amount: true,
      },
    });

    // Group payments by date in the application layer
    const groupedByDate: { [key: string]: number } = {};

    payments.forEach((payment) => {
      if (payment.date) {
        const dateStr = new Date(payment.date).toISOString().split("T")[0]; // Format: YYYY-MM-DD
        groupedByDate[dateStr] =
          (groupedByDate[dateStr] || 0) + (payment.amount || 0);
      }
    });

    // Convert grouped data to array format
    const data = Object.entries(groupedByDate).map(([date, totalAmount]) => ({
      date,
      totalAmount,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching payment amounts per day:", error);
    return NextResponse.json(
      { error: "Error fetching payment amounts per day" },
      { status: 500 }
    );
  }
}
