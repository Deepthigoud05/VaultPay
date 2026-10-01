const Invoice = require("../models/Invoice");
const User = require("../models/User");

const stripe = process.env.STRIPE_SECRET_KEY
    ? require("stripe")(process.env.STRIPE_SECRET_KEY)
    : null;

const createInvoice = async (req, res) => {
    try {
        const { client, amount, description } = req.body;

        if (!client || !amount || !description) {
            return res.status(400).json({
                message: "Please provide all invoice details"
            });
        }

        const clientUser = await User.findById(client);

        if (!clientUser) {
            return res.status(404).json({
                message: "Client not found"
            });
        }

        if (clientUser.role !== "Client") {
            return res.status(400).json({
                message: "Invoice can only be created for a client"
            });
        }

        const invoice = await Invoice.create({
            invoiceNumber: "INV-" + Date.now(),
            client,
            amount,
            description
        });

        res.status(201).json({
            message: "Invoice created successfully",
            invoice
        });

    } catch (error) {
        res.status(500).json({
            message: "Could not create invoice",
            error: error.message
        });
    }
};

const getClients = async (req, res) => {
    try {
        const clients = await User.find(
            { role: "Client" },
            {
                name: 1,
                email: 1
            }
        );

        res.json(clients);

    } catch (error) {
        res.status(500).json({
            message: "Could not get clients",
            error: error.message
        });
    }
};

const getInvoices = async (req, res) => {
    try {
        let invoices;

        if (req.user.role === "Admin") {
            invoices = await Invoice.find()
                .populate("client", "name email")
                .sort({ createdAt: -1 });
        } else {
            invoices = await Invoice.find({
                client: req.user.id
            }).sort({ createdAt: -1 });
        }

        res.json(invoices);

    } catch (error) {
        res.status(500).json({
            message: "Could not get invoices",
            error: error.message
        });
    }
};

const getInvoiceById = async (req, res) => {
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

        res.json(invoice);

    } catch (error) {
        res.status(500).json({
            message: "Could not get invoice",
            error: error.message
        });
    }
};

const createCheckoutSession = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({
                message: "Stripe is not configured yet"
            });
        }

        const invoice = await Invoice.findById(req.params.id)
            .populate("client", "name email");

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        if (invoice.client._id.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Forbidden: You cannot pay this invoice"
            });
        }

        if (invoice.status === "Paid") {
            return res.status(400).json({
                message: "Invoice is already paid"
            });
        }

        const session = await stripe.checkout.sessions.create({
            mode: "payment",

            customer_email: invoice.client.email,

            line_items: [
                {
                    price_data: {
                        currency: "usd",

                        product_data: {
                            name: invoice.invoiceNumber,
                            description: invoice.description
                        },

                        unit_amount: Math.round(invoice.amount * 100)
                    },

                    quantity: 1
                }
            ],

            metadata: {
                invoiceId: invoice._id.toString()
            },

            success_url: "http://localhost:5173/payment-success",
            cancel_url: "http://localhost:5173/payment-cancelled"
        });

        res.json({
            url: session.url
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Could not create checkout session",
            error: error.message
        });
    }
};

module.exports = {
    createInvoice,
    getClients,
    getInvoices,
    getInvoiceById,
    createCheckoutSession
};