// lib/email.ts
import nodemailer from "nodemailer";

// Configure your email transporter (example with Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Use app password for Gmail
  },
});

// Alternative configuration for custom SMTP
// const transporter = nodemailer.createTransporter({
//   host: process.env.SMTP_HOST,
//   port: parseInt(process.env.SMTP_PORT || '587'),
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASSWORD,
//   },
// });

interface PaymentEmailData {
  clientName: string;
  clientEmail?: string;
  companyName: string;
  amount: number;
  subscription: string;
  method: string;
  startDate: string;
  endDate: string;
  nextPaymentDate: string;
  paymentDate: string;
  paymentId: string;
  isForCompanyUser?: boolean;
  userRole?: string;
}

export async function sendPaymentConfirmationEmail(data: PaymentEmailData) {
  const isForCompanyUser = data.isForCompanyUser || false;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isForCompanyUser ? "Notification de Paiement Reçu" : "Confirmation de Paiement"}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #007bff;
          margin: 0;
          font-size: 28px;
        }
        .company-name {
          color: #6c757d;
          font-size: 18px;
          margin-top: 10px;
        }
        .payment-details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 5px 0;
          border-bottom: 1px solid #e9ecef;
        }
        .detail-label {
          font-weight: bold;
          color: #495057;
        }
        .detail-value {
          color: #212529;
        }
        .amount {
          font-size: 24px;
          font-weight: bold;
          color: #28a745;
          text-align: center;
          margin: 20px 0;
          padding: 15px;
          background: #d4edda;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          color: #6c757d;
          font-size: 14px;
        }
        .success-icon {
          color: #28a745;
          font-size: 48px;
          text-align: center;
          margin-bottom: 20px;
        }
        .client-info {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #2196f3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✓</div>
          <h1>${isForCompanyUser ? "Paiement Reçu" : "Paiement Confirmé"}</h1>
          <div class="company-name">${data.companyName}</div>
        </div>
        
        ${
          isForCompanyUser
            ? `
          <p>Bonjour,</p>
          <p>Un nouveau paiement a été traité avec succès dans votre système. Voici les détails de cette transaction :</p>
          
          <div class="client-info">
            <strong>Informations du client :</strong><br>
            <strong>Nom :</strong> ${data.clientName}
          </div>
        `
            : `
          <p>Bonjour ${data.clientName},</p>
          <p>Nous avons le plaisir de vous confirmer que votre paiement a été traité avec succès. Voici les détails de votre transaction :</p>
        `
        }
        
        <div class="amount">
          ${data.amount.toFixed(2)} €
        </div>
        
        <div class="payment-details">
          <div class="detail-row">
            <span class="detail-label">Référence de paiement :</span>
            <span class="detail-value">#${data.paymentId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date de paiement :</span>
            <span class="detail-value">${data.paymentDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Type d'abonnement :</span>
            <span class="detail-value">${data.subscription}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Méthode de paiement :</span>
            <span class="detail-value">${data.method}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Période de validité :</span>
            <span class="detail-value">Du ${data.startDate} au ${data.endDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Prochain paiement :</span>
            <span class="detail-value">${data.nextPaymentDate}</span>
          </div>
        </div>
        
        ${
          isForCompanyUser
            ? `
          <p>Ce paiement a été enregistré dans votre système de gestion et est maintenant visible dans votre tableau de bord.</p>
          <p>Si vous avez des questions concernant cette transaction, vous pouvez consulter les détails complets dans votre interface d'administration.</p>
        `
            : `
          <p>Votre abonnement est maintenant actif et vous pouvez profiter de tous nos services.</p>
          <p>Si vous avez des questions concernant votre paiement ou votre abonnement, n'hésitez pas à nous contacter.</p>
        `
        }
        
        <p>Cordialement,<br>
        ${isForCompanyUser ? "Le système de gestion" : `L'équipe ${data.companyName}`}</p>
        
        <div class="footer">
          <p>Cet email est un accusé de réception automatique. Merci de conserver ce message pour vos archives.</p>
          <p>© 2025 ${data.companyName}. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    ${isForCompanyUser ? "Notification de Paiement Reçu" : "Confirmation de Paiement"} - ${data.companyName}
    
    ${
      isForCompanyUser
        ? `
    Bonjour,
    
    Un nouveau paiement a été traité avec succès dans votre système.
    
    Informations du client :
    - Nom : ${data.clientName}
    `
        : `
    Bonjour ${data.clientName},
    
    Nous avons le plaisir de vous confirmer que votre paiement a été traité avec succès.
    `
    }
    
    Détails de la transaction :
    - Montant : ${data.amount.toFixed(2)} €
    - Référence : #${data.paymentId}
    - Date de paiement : ${data.paymentDate}
    - Type d'abonnement : ${data.subscription}
    - Méthode de paiement : ${data.method}
    - Période de validité : Du ${data.startDate} au ${data.endDate}
    - Prochain paiement : ${data.nextPaymentDate}
    
    ${
      isForCompanyUser
        ? `
    Ce paiement a été enregistré dans votre système de gestion et est maintenant visible dans votre tableau de bord.
    
    Si vous avez des questions concernant cette transaction, vous pouvez consulter les détails complets dans votre interface d'administration.
    `
        : `
    Votre abonnement est maintenant actif et vous pouvez profiter de tous nos services.
    
    Si vous avez des questions, n'hésitez pas à nous contacter.
    `
    }
    
    Cordialement,
    ${isForCompanyUser ? "Le système de gestion" : `L'équipe ${data.companyName}`}
  `;

  const mailOptions = {
    from: `"${data.companyName}" <${process.env.EMAIL_USER}>`,
    to: data.clientEmail,
    subject: `${isForCompanyUser ? "Nouveau paiement reçu" : "Confirmation de paiement"} - ${data.companyName}`,
    text: textContent,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      `${isForCompanyUser ? "Payment notification" : "Payment confirmation"} email sent successfully`
    );
    return { success: true };
  } catch (error) {
    console.error(
      `Error sending ${isForCompanyUser ? "payment notification" : "payment confirmation"} email:`,
      error
    );
    return { success: false, error };
  }
}
