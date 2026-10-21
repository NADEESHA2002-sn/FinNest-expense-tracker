const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
    createIncome,
    getAllIncome,
    deleteIncome
} = require("../controllers/incomeController");

const router = express.Router();

// Protect all income routes
router.use(authMiddleware);

router.post("/", createIncome);

router.get("/", getAllIncome);

router.delete("/:id", deleteIncome);

module.exports = router;