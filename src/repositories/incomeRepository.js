const Income = require("../models/Income");

const create = async (incomeData) => {
    const income = new Income(incomeData);

    return await income.save();
};

const findAll = async (userId) => {
    return await Income.find({ userId }).sort({ date: -1 });
};

const deleteById = async (id, userId) => {
    return await Income.findOneAndDelete({ _id: id, userId });
};

module.exports = {
    create,
    findAll,
    deleteById
};