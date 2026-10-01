const express = require("express");

const {
    createInvoice,
    getClients,
    getInvoices,
    getInvoiceById,
    createCheckoutSession
} = require("../controllers/invoiceController");

const {
    downloadInvoicePDF
} = require("../controllers/pdfController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
    "/clients",
    protect,
    authorize("Admin"),
    getClients
);

router.get(
    "/",
    protect,
    getInvoices
);

router.get(
    "/:id",
    protect,
    getInvoiceById
);

router.get(
    "/:id/pdf",
    protect,
    downloadInvoicePDF
);

router.post(
    "/",
    protect,
    authorize("Admin"),
    createInvoice
);

router.post(
    "/:id/checkout",
    protect,
    authorize("Client"),
    createCheckoutSession
);

module.exports = router;