require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


// Test route
app.get("/", (req, res) => {
    res.status(200).send("Expense Tracker API is running!");
});


// API routes
app.use("/api/auth", authRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/expenses", expenseRoutes);


// Start server only after MongoDB connects
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {

        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log("MongoDB is connected");
        });

    } catch (error) {

        console.error("Failed to start server:", error.message);
        process.exit(1);

    }
};

startServer();