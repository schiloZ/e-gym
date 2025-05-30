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
    const payments = await prisma.payment.findMany({
      where: {
        companyId: (session.user as any).companyId,
        status: "Completed",
      },
      select: { startDate: true, endDate: true },
    });

    const activeCounts = {};

    payments.forEach((p) => {
      const start = new Date(p.startDate!);
      const end = new Date(p.endDate!);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        (activeCounts as Record<string, number>)[dateStr] =
          ((activeCounts as Record<string, number>)[dateStr] || 0) + 1;
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
