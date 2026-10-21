const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
    createExpense,
    getAllExpenses,
    deleteExpense
} = require("../controllers/expenseController");


const router = express.Router();

// Protect all expense routes
router.use(authMiddleware);

router.post("/", createExpense);

router.get("/", getAllExpenses);

router.delete("/:id", deleteExpense);


module.exports = router;