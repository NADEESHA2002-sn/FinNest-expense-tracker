const incomeService = require("../services/incomeService");

const createIncome = async (req, res) => {
    try {
        const income = await incomeService.createIncome(req.body, req.user.id);

        res.status(201).json(income);

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

const getAllIncome = async (req, res) => {
    try {
        const incomes = await incomeService.getAllIncome(req.user.id);

        res.status(200).json(incomes);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const deleteIncome = async (req, res) => {
    try {
        const deleted = await incomeService.deleteIncome(req.params.id, req.user.id);
        res.status(200).json({
            message: "Income deleted successfully",
            income: deleted
        });
    } catch (error) {
        res.status(error.message === "Income not found" ? 404 : 400).json({
            message: error.message
        });
    }
};

module.exports = {
    createIncome,
    getAllIncome,
    deleteIncome
};