import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log("API DELETE /api/bills/[id] called with id:", params.id);

  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    !session.user.id ||
    !session.user.companyId
  ) {
    console.log("Unauthorized: No session, user ID, or company ID");
    return NextResponse.json(
      {
        error: "Unauthorized: User not authenticated or no company associated",
      },
      { status: 401 }
    );
  }

  const companyId = session.user.companyId;
  const billId = params.id;

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
      console.log(
        "Bill does not belong to company. Bill companyId:",
        bill.companyId,
        "Authenticated user's companyId:",
        companyId
      );
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
      where: { id: session.user.companyId },
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
          changedBy: session.user.id,
          companyId: session.user.companyId,
          description: "Bill deleted successfully",
        },
      });
    } else {
      console.log("Historic record not created for free subscription");
    }

    await prisma.notification.create({
      data: {
        type: "BILL_DELETED",
        message: `${bill.description} of ${formatCurrency(
          bill.amount
        )} deleted today`,
        companyId: session.user.companyId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: "Bill deleted successfully" });
  } catch (error) {
    console.error("Error deleting bill:", error);
    return NextResponse.json(
      { error: error.message || "Error deleting bill" },
      { status: 500 }
    );
  }
}

// Helper function to format currency (used in notification message)
function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value);
}
