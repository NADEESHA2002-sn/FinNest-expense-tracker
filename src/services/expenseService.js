const expenseRepository = require("../repositories/expenseRepository");


const createExpense = async (expenseData, userId) => {

    if (!userId) {
        throw new Error("User ID is required");
    }

    if (
        expenseData.amount === undefined ||
        expenseData.amount === null ||
        Number(expenseData.amount) <= 0
    ) {
        throw new Error("Amount must be greater than 0");
    }


    if (
        !expenseData.category ||
        !expenseData.category.trim()
    ) {
        throw new Error("Expense category is required");
    }


    const data = {
        userId,
        amount: Number(expenseData.amount),
        category: expenseData.category.trim(),
        date: expenseData.date || new Date(),
        description: expenseData.description
            ? expenseData.description.trim()
            : ""
    };


    console.log("Saving expense:", data);

    const savedExpense =
        await expenseRepository.create(data);

    console.log("Saved expense:", savedExpense);

    return savedExpense;
};


const getAllExpenses = async (userId) => {

    if (!userId) {
        throw new Error("User ID is required");
    }

    return await expenseRepository.findAll(userId);

};


const deleteExpense = async (id, userId) => {

    if (!id) {
        throw new Error("Expense ID is required");
    }

    if (!userId) {
        throw new Error("User ID is required");
    }


    const deleted =
        await expenseRepository.deleteById(id, userId);


    if (!deleted) {
        throw new Error("Expense not found");
    }


    return deleted;
};


module.exports = {
    createExpense,
    getAllExpenses,
    deleteExpense
};