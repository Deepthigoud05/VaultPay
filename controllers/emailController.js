const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

const Invoice = require("../models/Invoice");

const sendInvoiceEmail = async (invoiceId) => {
    try {
        const invoice = await Invoice.findById(invoiceId)
            .populate("client", "name email");

        if (!invoice) {
            console.log("Invoice not found for email");
            return;
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",

            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const doc = new PDFDocument({
            margin: 50
        });

        const chunks = [];

        doc.on("data", (chunk) => {
            chunks.push(chunk);
        });

        const pdfFinished = new Promise((resolve) => {
            doc.on("end", resolve);
        });

        doc
            .fontSize(24)
            .font("Helvetica-Bold")
            .text("NEXUS CORPORATE SERVICES");

        doc
            .fontSize(10)
            .font("Helvetica")
            .text("New York, NY, USA");

        doc.moveDown();

        doc
            .fontSize(20)
            .font("Helvetica-Bold")
            .text("PAYMENT RECEIPT");

        doc.moveDown();

        doc
            .fontSize(12)
            .font("Helvetica")
            .text(`Invoice Number: ${invoice.invoiceNumber}`);

        doc.text(
            `Date: ${new Date(invoice.createdAt).toLocaleDateString()}`
        );

        doc.moveDown();

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("BILL TO");

        doc.moveDown(0.5);

        doc
            .fontSize(12)
            .font("Helvetica")
            .text(invoice.client.name);

        doc.text(invoice.client.email);

        doc.moveDown();

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("SERVICE");

        doc.moveDown(0.5);

        doc
            .fontSize(12)
            .font("Helvetica")
            .text(invoice.description);

        doc.moveDown();

        doc
            .fontSize(16)
            .font("Helvetica-Bold")
            .text(`TOTAL AMOUNT: $${invoice.amount.toFixed(2)}`);

        doc.moveDown();

        doc
            .fontSize(24)
            .font("Helvetica-Bold")
            .text("PAID");

        doc.moveDown();

        doc
            .fontSize(11)
            .font("Helvetica")
            .text("Payment has been successfully received.");

        doc.moveDown(3);

        doc
            .fontSize(10)
            .font("Helvetica")
            .text("Thank you for your business.");

        doc.text(
            "This receipt was generated electronically by VaultPay."
        );

        doc.end();

        await pdfFinished;

        const pdfBuffer = Buffer.concat(chunks);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: invoice.client.email,
            subject: `Payment Receipt - ${invoice.invoiceNumber}`,

            text:
                `Hello ${invoice.client.name},\n\n` +
                `Your payment for invoice ${invoice.invoiceNumber} has been received successfully.\n\n` +
                `Please find your payment receipt attached.\n\n` +
                `Thank you,\nVaultPay`,

            attachments: [
                {
                    filename: `${invoice.invoiceNumber}.pdf`,
                    content: pdfBuffer
                }
            ]
        });

        console.log(
            `Receipt email sent to ${invoice.client.email}`
        );

    } catch (error) {
        console.log(
            "Email sending error:",
            error.message
        );
    }
};

module.exports = {
    sendInvoiceEmail
};