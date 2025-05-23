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
      where: { companyId: session.user.companyId, status: "Completed" },
      select: { startDate: true, endDate: true },
    });

    const today = new Date();
    const activeCounts = {};

    payments.forEach((p) => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        activeCounts[dateStr] = (activeCounts[dateStr] || 0) + 1;
      }
    });

    const data = Object.entries(activeCounts).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching active subscriptions per day:", error);
    return NextResponse.json(
      { error: "Error fetching active subscriptions per day" },
      { status: 500 }
    );
  }
}
