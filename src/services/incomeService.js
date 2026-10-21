const incomeRepository = require("../repositories/incomeRepository");

const createIncome = async (incomeData, userId) => {
    if (!userId) {
        throw new Error("User ID is required");
    }

    if (!incomeData.amount || Number(incomeData.amount) <= 0) {
        throw new Error("Amount must be greater than 0");
    }

    if (!incomeData.source || !incomeData.source.trim()) {
        throw new Error("Income source is required");
    }

    const data = {
        userId,
        amount: Number(incomeData.amount),
        source: incomeData.source.trim(),
        date: incomeData.date || new Date(),
        description: incomeData.description ? incomeData.description.trim() : ""
    };

    return await incomeRepository.create(data);
};

const getAllIncome = async (userId) => {
    if (!userId) {
        throw new Error("User ID is required");
    }
    return await incomeRepository.findAll(userId);
};

const deleteIncome = async (id, userId) => {
    if (!id) {
        throw new Error("Income ID is required");
    }
    if (!userId) {
        throw new Error("User ID is required");
    }
    const deleted = await incomeRepository.deleteById(id, userId);
    if (!deleted) {
        throw new Error("Income not found");
    }
    return deleted;
};

module.exports = {
    createIncome,
    getAllIncome,
    deleteIncome
};