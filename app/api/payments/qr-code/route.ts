// app/api/payment/register/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Use app password for Gmail
  },
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Payment data received:", data);

    // Validate required fields
    if (!data.amount || !data.clientName || !data.gymId || !data.clientId) {
      return NextResponse.json(
        {
          error:
            "Required fields are missing (amount, clientName, gymId, clientId)",
        },
        { status: 400 }
      );
    }

    //Validate amount
    const parsedAmount = Number(data.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.error("Invalid amount provided:", data.amount);
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Validate dates
    if (!data.startDate || !data.endDate || !data.nextPaymentDate) {
      return NextResponse.json(
        { error: "Start date, end date, and next payment date are required" },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify client belongs to the company
    if (client.companyId !== data.gymId) {
      return NextResponse.json(
        { error: "Client does not belong to the specified company" },
        { status: 403 }
      );
    }

    // Check company payment limits
    const company = await prisma.company.findUnique({
      where: { id: data.gymId },
      select: {
        paymentCount: true,
        maxPayments: true,
        subscriptionType: true,
        name: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (company.maxPayments && company.paymentCount >= company.maxPayments) {
      return NextResponse.json(
        {
          error: `Payment limit reached (${company.paymentCount}/${company.maxPayments}). Please upgrade your plan.`,
        },
        { status: 403 }
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: parsedAmount,
        subscription: data.subscription || "Monthly",
        method: data.method || "Cash",
        status: "Completed",
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        nextPaymentDate: new Date(data.nextPaymentDate),
        paymentStatus: data.paymentStatus || "Paid",
        date: new Date(),
        client: { connect: { id: data.clientId } },
        company: { connect: { id: data.gymId } },
        ...(data.paymentDate && { paymentDate: new Date(data.paymentDate) }),
      },
    });

    // Update company payment count
    await prisma.company.update({
      where: { id: data.gymId },
      data: { paymentCount: { increment: 1 } },
    });

    // Create historic record if not on free plan
    if (company.subscriptionType !== "free") {
      await prisma.historic.create({
        data: {
          action: "CREATE",
          entityType: "PAYMENT",
          entityId: payment.id,
          oldData: null,
          newData: {
            prix: parsedAmount,
            souscription: data.subscription || "Monthly",
            method: data.method || "Cash",
            status: "Payé",
            Debut: data.startDate,
            Fin: data.endDate,
            ProchaineDate: data.nextPaymentDate,
            clientName: data.clientName,
          },
          description: "Payment created successfully",
          payment: { connect: { id: payment.id } },
          company: { connect: { id: data.gymId } },
        },
      });
    }

    // Prepare email content
    const emailDetails = {
      companyName: company.name,
      clientName: data.clientName,
      amount: parsedAmount.toFixed(2),
      subscription: data.subscription || "Mensuel",
      method: data.method === "Cash" ? "Espèces" : "Carte",
      paymentDate: new Date().toLocaleDateString("fr-FR"),
      period: `Du ${new Date(data.startDate).toLocaleDateString("fr-FR")} au ${new Date(data.endDate).toLocaleDateString("fr-FR")}`,
      nextPayment: new Date(data.nextPaymentDate).toLocaleDateString("fr-FR"),
    };

    // Send email to company users (MANDATORY)
    const companyUsers = await prisma.user.findMany({
      where: { companyId: data.gymId },
      select: { email: true },
    });

    const subscriptionLabelMap: Record<string, string> = {
      Daily: "Jour",
      Weekly: "Semaine",
      Monthly: "Mois",
      Yearly: "Année",
    };

    const subscriptionFr =
      subscriptionLabelMap[data.subscription] || "Non défini";

    if (companyUsers.length > 0) {
      const companyEmailPromises = companyUsers.map((user) => {
        return transporter.sendMail({
          from: `"${emailDetails.companyName}" <${process.env.EMAIL_FROM}>`,
          to: user.email,
          subject: "Nouveau paiement enregistré",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #2c3e50;">Nouveau paiement enregistré</h1>
              </div>
              
              <div style="margin-bottom: 25px;">
                <p>Bonjour cher gestionnaire</p>
                <p>Un nouveau paiement a été enregistré dans votre système.</p>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 25px;">
                <h3 style="color: #2c3e50; margin-top: 0;">Détails du paiement</h3>
                <p><strong>Client:</strong> ${emailDetails.clientName}</p>
                <p><strong>Montant:</strong> ${emailDetails.amount} FCFA</p>
                <p><strong>Type d'abonnement:</strong> ${subscriptionFr}</p>
                <p><strong>Méthode de paiement:</strong> ${emailDetails.method}</p>
                <p><strong>Période couverte:</strong> ${emailDetails.period}</p>
                <p><strong>Prochain paiement:</strong> ${emailDetails.nextPayment}</p>
              </div>
              
              <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
                <p>Cordialement,</p>
                <p><strong>L'équipe E-GYM</strong></p>
              </div>
            </div>
          `,
        });
      });

      await Promise.all(companyEmailPromises);
      console.log("Emails sent to company users");
    } else {
      console.warn("No company users found to send payment notification");
    }

    // Send email to client if email exists (OPTIONAL)
    if (client.email) {
      await transporter.sendMail({
        from: `"${emailDetails.companyName}" <${process.env.EMAIL_FROM}>`,
        to: client.email,
        subject: "Confirmation de votre paiement",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #2c3e50;">Confirmation de paiement</h1>
            </div>
            
            <div style="margin-bottom: 25px;">
              <p>Bonjour ${emailDetails.clientName},</p>
              <p>Nous vous remercions pour votre paiement. Voici le récapitulatif :</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 25px;">
              <h3 style="color: #2c3e50; margin-top: 0;">Détails de votre paiement</h3>
              <p><strong>Montant:</strong> ${emailDetails.amount} €</p>
              <p><strong>Type d'abonnement:</strong> ${emailDetails.subscription}</p>
              <p><strong>Méthode de paiement:</strong> ${emailDetails.method}</p>
              <p><strong>Période couverte:</strong> ${emailDetails.period}</p>
              <p><strong>Prochain paiement:</strong> ${emailDetails.nextPayment}</p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <p>Votre abonnement est maintenant actif pour la période indiquée.</p>
              <p>Pour toute question, n'hésitez pas à nous contacter.</p>
            </div>
            
            <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
              <p>Cordialement,</p>
              <p><strong>L'équipe ${emailDetails.companyName}</strong></p>
            </div>
          </div>
        `,
      });
      console.log("Confirmation email sent to client");
    }

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully",
      paymentId: payment.id,
      payment: payment,
    });
  } catch (error: any) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: error.message || "Error processing payment" },
      { status: 500 }
    );
  }
}
//Tchai
// export async function POST(request: Request) {
//   try {
//     const data = await request.json();
//     console.log("Payment data received:", data);

//     // Validate required fields based on your input structure
//     if (!data.amount || !data.clientName || !data.gymId || !data.clientId) {
//       return NextResponse.json(
//         {
//           error:
//             "Required fields are missing (amount, clientName, gymId, clientId)",
//         },
//         { status: 400 }
//       );
//     }

//     // Validate amount
//     const parsedAmount = Number(data.amount);
//     if (isNaN(parsedAmount) || parsedAmount <= 0) {
//       console.error("Invalid amount provided:", data.amount);
//       return NextResponse.json(
//         { error: "Amount must be a positive number" },
//         { status: 400 }
//       );
//     }

//     // Validate required date fields
//     if (!data.startDate || !data.endDate || !data.nextPaymentDate) {
//       console.error("Missing date fields:", {
//         startDate: data.startDate,
//         endDate: data.endDate,
//         nextPaymentDate: data.nextPaymentDate,
//       });
//       return NextResponse.json(
//         { error: "Start date, end date, and next payment date are required" },
//         { status: 400 }
//       );
//     }

//     // Verify client exists and belongs to the company
//     const client = await prisma.client.findUnique({
//       where: { id: data.clientId },
//     });

//     if (!client) {
//       console.error("Client not found:", data.clientId);
//       return NextResponse.json({ error: "Client not found" }, { status: 404 });
//     }

//     if (client.companyId !== data.gymId) {
//       console.log("Client does not belong to the specified company");
//       return NextResponse.json(
//         { error: "Client does not belong to the specified company" },
//         { status: 403 }
//       );
//     }

//     // Check company payment limits
//     const company = await prisma.company.findUnique({
//       where: { id: data.gymId },
//       select: { paymentCount: true, maxPayments: true, subscriptionType: true },
//     });

//     if (
//       company &&
//       company.maxPayments &&
//       company.paymentCount >= company.maxPayments
//     ) {
//       console.error(
//         `Payment limit reached for company: ${company.paymentCount} payments`
//       );
//       return NextResponse.json(
//         {
//           error: `Limit of ${company.maxPayments} payments reached for your ${company.subscriptionType} plan. Upgrade to increase limit.`,
//         },
//         { status: 403 }
//       );
//     }

//     // Prepare payment data according to schema
//     const paymentData: any = {
//       amount: parsedAmount,
//       subscription: data.subscription || "Monthly",
//       method: data.method || "Cash",
//       status: "Completed",
//       startDate: new Date(data.startDate),
//       endDate: new Date(data.endDate),
//       nextPaymentDate: new Date(data.nextPaymentDate),
//       paymentStatus: data.paymentStatus || "Paid",
//       date: new Date(),
//       client: {
//         connect: { id: data.clientId },
//       },
//       company: {
//         connect: { id: data.gymId },
//       },
//     };

//     // Add paymentDate if provided
//     if (data.paymentDate) {
//       paymentData.paymentDate = new Date(data.paymentDate);
//     }

//     // Create payment record
//     const payment = await prisma.payment.create({
//       data: paymentData,
//     });

//     // Update company payment count
//     await prisma.company.update({
//       where: { id: data.gymId },
//       data: { paymentCount: { increment: 1 } },
//     });

//     // Create historic record if not on free plan
//     if (company?.subscriptionType !== "free") {
//       const historicData = {
//         prix: parsedAmount,
//         souscription: data.subscription || "Monthly",
//         method: data.method || "Cash",
//         status: "Payé",
//         Debut: data.startDate,
//         Fin: data.endDate,
//         ProchaineDate: data.nextPaymentDate,
//         clientName: data.clientName,
//       };

//       await prisma.historic.create({
//         data: {
//           action: "CREATE",
//           entityType: "PAYMENT",
//           entityId: payment.id,
//           oldData: null,
//           newData: historicData,
//           description: "Payment created successfully",
//           payment: {
//             connect: { id: payment.id },
//           },
//           company: {
//             connect: { id: data.gymId },
//           },
//         },
//       });
//     }

//     return NextResponse.json({
//       success: true,
//       message: "Payment recorded successfully",
//       paymentId: payment.id,
//       payment: payment,
//     });
//   } catch (error: any) {
//     console.error("Payment creation error:", error);
//     return NextResponse.json(
//       { error: error.message || "Error processing payment" },
//       { status: 500 }
//     );
//   }
// }
// export async function POST(request: Request) {
//   try {
//     const data = await request.json();
//     console.log("Payment data received:", data);
//     // Validate required fields
//     if (!data.amount || !data.clientName || !data.gymId) {
//       return NextResponse.json(
//         { error: "Required fields are missing" },
//         { status: 400 }
//       );
//     }

//     // Create payment record
//     const payment = await prisma.payment.create({
//       data: {
//         amount: parseFloat(data.amount),
//         method: data.method || "Cash",
//         subscription: data.subscription || "Monthly",
//         paymentDate: new Date(data.paymentDate || new Date()),
//         companyId: data.gymId,
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       paymentId: payment.id,
//     });
//   } catch (error) {
//     console.error("Payment error:", error);
//     return NextResponse.json(
//       { error: "Error processing payment" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: Request) {
//   const data = await request.json();

//   const userId = data.clientId;
//   const companyId = data.gymId;

//   if (!data.clientId || !data.amount) {
//     console.error("Missing required fields:", data);
//     return NextResponse.json(
//       { error: "Client ID and amount are required" },
//       { status: 400 }
//     );
//   }

//   const parsedAmount = Number(data.amount);
//   if (isNaN(parsedAmount) || parsedAmount <= 0) {
//     console.error("Invalid amount provided:", data.amount);
//     return NextResponse.json(
//       { error: "Amount must be a positive number" },
//       { status: 400 }
//     );
//   }
//   // Check payment limit using company data instead of user
//   // if (user.company && user.company.paymentCount >= user.company.maxPayments) {
//   //   console.error(
//   //     `Payment limit reached for company: ${user.company.paymentCount} payments`
//   //   );
//   //   return NextResponse.json(
//   //     {
//   //       error: `Limit of ${user.company.maxPayments} payments reached for your ${user.company.subscriptionType} plan. Upgrade to increase limit.`,
//   //     },
//   //     { status: 403 }
//   //   );
//   // }

//   try {
//     const client = await prisma.client.findUnique({
//       where: { id: data.clientId },
//     });
//     if (!client) {
//       console.error("Client not found:", data.clientId);
//       return NextResponse.json({ error: "Client not found" }, { status: 404 });
//     }
//     if (client.companyId !== companyId) {
//       console.log("Client does not belong to the authenticated user's company");
//       return NextResponse.json(
//         { error: "Client does not belong to the authenticated user's company" },
//         { status: 403 }
//       );
//     }

//     // Calculate dates based on subscription type
//     const currentDate = new Date();
//     const startDate = new Date(data.startDate || currentDate);
//     let endDate = new Date();
//     let nextPaymentDate = new Date();

//     switch (data.subscription) {
//       case "Daily":
//         endDate = new Date(startDate);
//         nextPaymentDate = new Date(startDate);
//         nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);
//         break;
//       case "Weekly":
//         endDate = new Date(startDate);
//         endDate.setDate(endDate.getDate() + 7);
//         nextPaymentDate = new Date(endDate);
//         nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);
//         break;
//       case "Monthly":
//         endDate = new Date(startDate);
//         endDate.setDate(endDate.getDate() + 30);
//         nextPaymentDate = new Date(endDate);
//         nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);
//         break;
//       case "Quarterly":
//         endDate = new Date(startDate);
//         endDate.setDate(endDate.getDate() + 90);
//         nextPaymentDate = new Date(endDate);
//         nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);
//         break;
//       case "Yearly":
//         endDate = new Date(startDate);
//         endDate.setDate(endDate.getDate() + 365);
//         nextPaymentDate = new Date(endDate);
//         nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);
//         break;
//       default:
//         // Default to Monthly if no subscription type is provided
//         endDate = new Date(startDate);
//         endDate.setDate(endDate.getDate() + 30);
//         nextPaymentDate = new Date(endDate);
//         nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);
//     }

//     const paymentData: any = {
//       amount: parsedAmount,
//       subscription: data.subscription || "Monthly",
//       method: "Cash",
//       status: "Completed",
//       startDate: startDate,
//       endDate: endDate,
//       nextPaymentDate: nextPaymentDate,
//       paymentStatus: data.paymentStatus || "Paid",
//       date: currentDate,
//       client: {
//         connect: { id: data.clientId },
//       },
//       user: {
//         connect: { id: userId },
//       },
//       company: {
//         connect: { id: companyId },
//       },
//     };

//     if (data.paymentDate) {
//       paymentData.paymentDate = new Date(data.paymentDate);
//     }

//     const company1 = await prisma.company.findUnique({
//       where: { id: data.gymId },
//       select: { paymentCount: true, maxPayments: true, subscriptionType: true },
//     });

//     if (
//       company1 &&
//       company1.maxPayments &&
//       company1.paymentCount >= company1.maxPayments
//     ) {
//       return NextResponse.json(
//         {
//           error: `Vous avez atteint la limite de ${company1.maxPayments} paiements pour votre plan. Veuillez mettre à niveau votre abonnement pour augmenter cette limite.`,
//         },
//         { status: 403 }
//       );
//     }

//     const payment = await prisma.payment.create({
//       data: paymentData,
//     });

//     await prisma.company.update({
//       where: { id: data.gymId },
//       data: { paymentCount: { increment: 1 } },
//     });

//     const newData = {
//       prix: parsedAmount,
//       souscription: data.subscription || "Monthly",
//       method: "Cash",
//       status: "Payé",
//       Debut: startDate.toISOString().split("T")[0],
//       Fin: endDate.toISOString().split("T")[0],
//       ProchaineDate: nextPaymentDate.toISOString().split("T")[0],
//       clientName: client.name,
//     };

//     const company = await prisma.company.findUnique({
//       where: { id: data.gymId },
//       select: { subscriptionType: true },
//     });

//     if (company?.subscriptionType !== "free") {
//       await prisma.historic.create({
//         data: {
//           action: "CREATE",
//           entityType: "PAYMENT",
//           entityId: payment.id,
//           paymentId: payment.id,
//           oldData: null,
//           newData,
//           changedBy: userId,
//           companyId: data.gymId,
//           description: "Payment created successfully",
//         },
//       });
//     } else {
//       console.log("Historic record not created for free subscription");
//     }

//     await prisma.notification.create({
//       data: {
//         type: "PAYMENT_RECEIVED",
//         message: `${parsedAmount.toLocaleString()} FCFA de ${client.name}`,
//         userId: userId,
//         paymentId: payment.id,
//       },
//     });

//     return NextResponse.json({ message: "Payment recorded", payment });
//   } catch (error: any) {
//     console.error("Payment creation error:", error);
//     return NextResponse.json(
//       { error: error.message || "Error recording payment" },
//       { status: 400 }
//     );
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const data = await request.json();
//     console.log("Payment data received:", data);
//     console.log("Processing payment for:", data.clientName);
//     console.log("Gym ID:", data.gymId);
//     console.log("Payment amount:", data.amount);
//     // Validate required fields
//     if (!data.amount || !data.gymId) {
//       return NextResponse.json(
//         { error: "Amount, client name, and gym ID are required" },
//         { status: 400 }
//       );
//     }

//     // Validate amount
//     const parsedAmount = Number(data.amount);
//     if (isNaN(parsedAmount) || parsedAmount <= 0) {
//       return NextResponse.json(
//         { error: "Amount must be a positive number" },
//         { status: 400 }
//       );
//     }

//     // Create payment record
//     const payment = await prisma.payment.create({
//       data: {
//         amount: parsedAmount,
//         method: data.method || "Cash",
//         subscription: data.subscription || "Monthly",
//         paymentDate: new Date(data.paymentDate || new Date()),
//         companyId: data.gymId,
//         userId: data.clientId, // Associate with the authenticated user
//         status: "Completed",
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       paymentId: payment.id,
//       amount: payment.amount,
//       clientName: payment.clientName,
//     });
//   } catch (error) {
//     console.error("Payment error:", error);
//     return NextResponse.json(
//       { error: "Error processing payment" },
//       { status: 500 }
//     );
//   }
// }
