const express = require("express");

const stripe = process.env.STRIPE_SECRET_KEY
    ? require("stripe")(process.env.STRIPE_SECRET_KEY)
    : null;

const Invoice = require("../models/Invoice");
const { sendInvoiceEmail } = require("../controllers/emailController");

const router = express.Router();

router.post(
    "/stripe",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        if (!stripe) {
            return res.status(503).json({
                message: "Stripe is not configured yet"
            });
        }

        const signature = req.headers["stripe-signature"];

        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (error) {
            console.log(
                "Webhook signature verification failed"
            );

            return res.status(400).send(
                `Webhook Error: ${error.message}`
            );
        }

        try {
            if (event.type === "checkout.session.completed") {
                const session = event.data.object;

                const invoiceId = session.metadata.invoiceId;

                if (!invoiceId) {
                    return res.json({
                        received: true
                    });
                }

                const invoice = await Invoice.findById(invoiceId);

                if (!invoice) {
                    console.log("Invoice not found");
                    return res.json({
                        received: true
                    });
                }

                if (invoice.status !== "Paid") {
                    invoice.status = "Paid";

                    await invoice.save();

                    console.log(
                        `Invoice ${invoiceId} marked as Paid`
                    );

                    await sendInvoiceEmail(invoiceId);
                }
            }

            res.json({
                received: true
            });

        } catch (error) {
            console.log(
                "Webhook processing error:",
                error.message
            );

            res.status(500).json({
                message: "Webhook processing failed"
            });
        }
    }
);

module.exports = router;