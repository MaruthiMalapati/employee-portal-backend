const express = require("express");
const cors = require("cors");
require("dotenv").config();
const adminRoutes = require("./routes/adminRoutes");
require("./cron/autoLogout");
require("./cron/sendEveningDailyAttendanceEmail");
require("./cron/sendMorningAttendanceEmail");

const passwordRoutes = require("./routes/passwordRoutes");


const reportRoutes = require("./routes/reportRoutes");
const loginRoutes = require("./routes/loginRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/login", loginRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/auth", passwordRoutes);


app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    time: new Date().toISOString()
  });
});






app.listen(process.env.PORT || 3003, () => {
  console.log("Server running on port", process.env.PORT || 3003);
});



