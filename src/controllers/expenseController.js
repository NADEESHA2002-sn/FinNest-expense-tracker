const expenseService = require("../services/expenseService");


const createExpense = async (req, res) => {

    try {

        console.log(`POST /api/expenses [User: ${req.user.id}]`);
        console.log("Request body:", req.body);

        const expense = await expenseService.createExpense(req.body, req.user.id);

        console.log("Expense created:", expense);

        res.status(201).json(expense);

    } catch (error) {

        console.error("Create expense error:", error);

        res.status(400).json({
            message: error.message
        });

    }

};


const getAllExpenses = async (req, res) => {

    try {

        console.log(`GET /api/expenses [User: ${req.user.id}]`);

        const expenses = await expenseService.getAllExpenses(req.user.id);

        console.log(`Found ${expenses.length} expenses for user`);

        res.status(200).json(expenses);

    } catch (error) {

        console.error("Get expenses error:", error);

        res.status(500).json({
            message: error.message
        });

    }

};


const deleteExpense = async (req, res) => {

    try {

        console.log(`DELETE /api/expenses/${req.params.id} [User: ${req.user.id}]`);

        const deleted =
            await expenseService.deleteExpense(req.params.id, req.user.id);

        res.status(200).json({
            message: "Expense deleted successfully",
            expense: deleted
        });

    } catch (error) {

        console.error("Delete expense error:", error);

        res.status(
            error.message === "Expense not found" ? 404 : 400
        ).json({
            message: error.message
        });

    }

};


module.exports = {
    createExpense,
    getAllExpenses,
    deleteExpense
};