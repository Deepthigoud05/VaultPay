const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/profile", protect, (req, res) => {
    res.json({
        message: "You are logged in",
        user: req.user
    });
});

router.get("/admin", protect, authorize("Admin"), (req, res) => {
    res.json({
        message: "Welcome Admin"
    });
});

router.get("/client", protect, authorize("Client"), (req, res) => {
    res.json({
        message: "Welcome Client"
    });
});

module.exports = router;