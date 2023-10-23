const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const express = require("express");
const connectDB = require("./config/db");
let app = express();

// datebase configurations
connectDB();

app.use(cors());
app.use(express.json());

const userRouters = require("./routers/user_routers");
const categoryRouters = require("./routers/category_routers");
const ticketRouters = require("./routers/ticket_routers");
const dashboardRouters = require("./routers/dashboard_routers");

// all routes - APIS
app.use("/api", userRouters);
app.use("/api", categoryRouters);
app.use("/api", ticketRouters);
app.use("/api", dashboardRouters);

// for example
// http://localhost:9000/api/register/a/user

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
