import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop(); // Extracts the ID from the path

  console.log("API DELETE /api/bills/[id] called with id:", id);

  const session = await getServerSession(authOptions as any);

  if (
    !session ||
    typeof session !== "object" ||
    !("user" in session) ||
    !session.user ||
    !(session.user as any).id ||
    !(session.user as any).companyId
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }

  const companyId = (session.user as any).companyId;
  const billId = id;

  if (!billId || typeof billId !== "string") {
    return NextResponse.json(
      { error: "Invalid bill ID format" },
      { status: 400 }
    );
  }

  try {
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (bill.companyId !== companyId) {
      return NextResponse.json(
        { error: "Bill does not belong to the authenticated user's company" },
        { status: 403 }
      );
    }

    const oldData = {
      description: bill.description,
      amount: bill.amount,
      date: bill.date,
      category: bill.category,
    };

    await prisma.bill.delete({
      where: { id: billId },
    });

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { subscriptionType: true },
    });

    if (company?.subscriptionType !== "free") {
      await prisma.historic.create({
        data: {
          action: "DELETE",
          entityType: "BILL",
          entityId: billId,
          oldData,
          newData: null,
          changedBy: (session.user as any).id,
          companyId: companyId,
          description: "Bill deleted successfully",
        },
      });
    }

    await prisma.notification.create({
      data: {
        type: "BILL_DELETED",
        message: `${bill.description} of ${formatCurrency(
          bill.amount
        )} deleted today`,
        companyId: companyId,
        userId: (session.user as any).id,
      },
    });

    return NextResponse.json({ message: "Bill deleted successfully" });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error deleting bill" },
      { status: 500 }
    );
  }
}

function formatCurrency(value: number | bigint) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value);
}
