const PDFDocument = require("pdfkit");
const Invoice = require("../models/Invoice");
const path = require("path");

const downloadInvoicePDF = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate("client", "name email");

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        if (
            req.user.role !== "Admin" &&
            invoice.client._id.toString() !== req.user.id
        ) {
            return res.status(403).json({
                message: "Forbidden: You cannot access this invoice"
            });
        }

        const doc = new PDFDocument({
            margin: 50
        });

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${invoice.invoiceNumber}.pdf"`
        );

        doc.pipe(res);

        const logoPath = path.join(
            __dirname,
            "../assets/nexus-logo.png"
        );

        doc.image(
            logoPath,
            50,
            40,
            {
                width: 230
            }
        );

        doc
            .fontSize(10)
            .font("Helvetica")
            .text(
                "New York, NY, USA",
                50,
                135
            );

        doc
            .fontSize(20)
            .font("Helvetica-Bold")
            .text(
                invoice.status === "Paid"
                    ? "PAYMENT RECEIPT"
                    : "INVOICE",
                50,
                175
            );

        doc
            .moveTo(50, 210)
            .lineTo(545, 210)
            .stroke();

        doc
            .fontSize(12)
            .font("Helvetica");

        doc.text(
            `Invoice Number: ${invoice.invoiceNumber}`,
            50,
            230
        );

        doc.text(
            `Date: ${new Date(
                invoice.createdAt
            ).toLocaleDateString()}`,
            50,
            250
        );

        doc.moveDown(2);

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("BILL TO", 50, 290);

        doc
            .fontSize(12)
            .font("Helvetica")
            .text(
                invoice.client.name,
                50,
                315
            );

        doc.text(
            invoice.client.email,
            50,
            335
        );

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("SERVICE", 50, 380);

        doc
            .fontSize(12)
            .font("Helvetica")
            .text(
                invoice.description,
                50,
                405,
                {
                    width: 495
                }
            );

        doc
            .fontSize(16)
            .font("Helvetica-Bold")
            .text(
                `TOTAL AMOUNT: $${invoice.amount.toFixed(2)}`,
                50,
                465
            );

        if (invoice.status === "Paid") {
            const stampX = 390;
            const stampY = 500;

            doc.save();

            doc.rotate(-12, {
                origin: [
                    stampX + 70,
                    stampY + 25
                ]
            });

            doc
                .lineWidth(3)
                .strokeColor("#dc2626")
                .roundedRect(
                    stampX,
                    stampY,
                    140,
                    55,
                    8
                )
                .stroke();

            doc
                .lineWidth(1)
                .roundedRect(
                    stampX + 5,
                    stampY + 5,
                    130,
                    45,
                    5
                )
                .stroke();

            doc
                .fillColor("#dc2626")
                .fontSize(26)
                .font("Helvetica-Bold")
                .text(
                    "PAID",
                    stampX + 28,
                    stampY + 13,
                    {
                        width: 85,
                        align: "center"
                    }
                );

            doc.restore();

            doc
                .fillColor("black")
                .fontSize(11)
                .font("Helvetica")
                .text(
                    "Payment has been successfully received.",
                    50,
                    535
                );
        } else {
            doc
                .fontSize(14)
                .font("Helvetica-Bold")
                .text(
                    "STATUS: PENDING",
                    50,
                    520
                );
        }

        doc
            .fontSize(10)
            .font("Helvetica")
            .text(
                "Thank you for your business.",
                50,
                650
            );

        doc.text(
            "This document was generated electronically by VaultPay.",
            50,
            668
        );

        doc
            .fontSize(9)
            .fillColor("#666666")
            .text(
                "NEXUS CORPORATE SERVICES",
                50,
                720
            );

        doc.text(
            "Professional financial services and payment solutions",
            50,
            735
        );

        doc.end();

    } catch (error) {
        console.log(
            "PDF generation error:",
            error.message
        );

        res.status(500).json({
            message: "Could not generate PDF"
        });
    }
};

module.exports = {
    downloadInvoicePDF
};