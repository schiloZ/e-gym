import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payments = await prisma.payment.findMany({
      where: { companyId: session.user.companyId },
      select: {
        date: true,
        amount: true,
      },
    });
    const groupedByDate: { [key: string]: number } = {};

    payments.forEach((payment) => {
      if (payment.date) {
        const dateStr = new Date(payment.date).toISOString().split("T")[0];
        groupedByDate[dateStr] =
          (groupedByDate[dateStr] || 0) + (payment.amount || 0);
      }
    });

    const data = Object.entries(groupedByDate)
      .map(([date, totalAmount]) => ({
        date,
        totalAmount,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching payment amounts per day:", error);
    return NextResponse.json(
      { error: "Error fetching payment amounts per day" },
      { status: 500 }
    );
  }
}
