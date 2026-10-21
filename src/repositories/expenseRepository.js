const Expense = require("../models/Expense");


const create = async (expenseData) => {

    const expense = new Expense(expenseData);

    return await expense.save();

};


const findAll = async (userId) => {

    return await Expense
        .find({ userId })
        .sort({ date: -1 });

};


const deleteById = async (id, userId) => {

    return await Expense.findOneAndDelete({ _id: id, userId });

};


module.exports = {
    create,
    findAll,
    deleteById
};