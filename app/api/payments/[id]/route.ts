import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(
    "API GET /api/payments/[paymentId] called with paymentId:",
    params.id
  );

  // Get the session
  const session = await getServerSession(authOptions);

  // Check if the user is authenticated
  if (!session || !session.user || !session.user.id) {
    console.log("Unauthorized: No session or user ID");
    return NextResponse.json(
      { error: "Unauthorized: User not authenticated" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const paymentId = params.id;

  // Validate paymentId as a MongoDB ObjectId
  if (!ObjectId.isValid(paymentId)) {
    console.log("Invalid paymentId format:", paymentId);
    return NextResponse.json(
      { error: "Invalid payment ID format" },
      { status: 400 }
    );
  }

  try {
    // Fetch the payment with associated client and user
    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        client: {
          include: { user: true }, // Include client and its user
        },
        user: true, // Include the user to verify ownership
      },
    });

    if (!payment) {
      console.log("Payment not found for paymentId:", paymentId);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify the payment belongs to the authenticated user
    if (payment.userId !== userId) {
      console.log(
        "Payment does not belong to user. Payment userId:",
        payment.userId,
        "Authenticated userId:",
        userId
      );
      return NextResponse.json(
        { error: "Payment does not belong to the authenticated user" },
        { status: 403 }
      );
    }
    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json(
      { error: "Error fetching payment data" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(
    "API DELETE /api/payments/[paymentId] called with paymentId:",
    params.id
  );

  // Get the session
  const session = await getServerSession(authOptions);

  // Check if the user is authenticated
  if (!session || !session.user || !session.user.id) {
    console.log("Unauthorized: No session or user ID");
    return NextResponse.json(
      { error: "Unauthorized: User not authenticated" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const paymentId = params.id;

  // Validate paymentId as a MongoDB ObjectId
  if (!ObjectId.isValid(paymentId)) {
    console.log("Invalid paymentId format:", paymentId);
    return NextResponse.json(
      { error: "Invalid payment ID format" },
      { status: 400 }
    );
  }

  try {
    // Fetch the payment to verify ownership
    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

    if (!payment) {
      console.log("Payment not found for paymentId:", paymentId);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify the payment belongs to the authenticated user
    if (payment.userId !== userId) {
      console.log(
        "Payment does not belong to user. Payment userId:",
        payment.userId,
        "Authenticated userId:",
        userId
      );
      return NextResponse.json(
        { error: "Payment does not belong to the authenticated user" },
        { status: 403 }
      );
    }

    // Delete the payment
    await prisma.payment.delete({
      where: {
        id: paymentId,
      },
    });

    console.log("Payment deleted successfully:", paymentId);
    return NextResponse.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Error deleting payment" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(
    "API PATCH /api/payments/[paymentId] called with paymentId:",
    params.id
  );

  // Get the session
  const session = await getServerSession(authOptions);

  // Check if the user is authenticated
  if (!session || !session.user || !session.user.id) {
    console.log("Unauthorized: No session or user ID");
    return NextResponse.json(
      { error: "Unauthorized: User not authenticated" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const paymentId = params.id;

  // Validate paymentId as a MongoDB ObjectId
  if (!ObjectId.isValid(paymentId)) {
    console.log("Invalid paymentId format:", paymentId);
    return NextResponse.json(
      { error: "Invalid payment ID format" },
      { status: 400 }
    );
  }

  try {
    // Get the updated data from the request body
    const {
      amount,
      subscription,
      method,
      status,
      paymentStatus,
      startDate,
      endDate,
      nextPaymentDate,
      paymentDate,
    } = await request.json();

    // Validate required fields
    if (
      !amount ||
      !subscription ||
      !method ||
      !status ||
      !paymentStatus ||
      !startDate ||
      !endDate
    ) {
      return NextResponse.json(
        {
          error:
            "Amount, subscription, method, status, payment status, start date, and end date are required",
        },
        { status: 400 }
      );
    }

    // Validate amount
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Validate dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    let parsedNextPaymentDate = nextPaymentDate
      ? new Date(nextPaymentDate)
      : undefined;
    let parsedPaymentDate = paymentDate ? new Date(paymentDate) : undefined;

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid start or end date format" },
        { status: 400 }
      );
    }

    if (nextPaymentDate && isNaN(parsedNextPaymentDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid next payment date format" },
        { status: 400 }
      );
    }

    if (paymentDate && isNaN(parsedPaymentDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid payment date format" },
        { status: 400 }
      );
    }

    // Fetch the payment to verify ownership
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      console.log("Payment not found for paymentId:", paymentId);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.userId !== userId) {
      console.log(
        "Payment does not belong to user. Payment userId:",
        payment.userId,
        "Authenticated userId:",
        userId
      );
      return NextResponse.json(
        { error: "Payment does not belong to the authenticated user" },
        { status: 403 }
      );
    }

    // Update the payment
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        amount: parsedAmount,
        subscription,
        method,
        status,
        paymentStatus,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        nextPaymentDate: parsedNextPaymentDate,
        paymentDate: parsedPaymentDate,
      },
    });

    console.log("Payment updated successfully:", updatedPayment);
    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: error.message || "Error updating payment data" },
      { status: 500 }
    );
  }
}
