const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const authorizeAdmin = require("../middleware/authorizeAdmin");
const eveningDailyAttendanceReport = require("../reports/eveningDailyAttendanceReport");

const router = express.Router();

router.get( "/daily-attendance", authenticate, authorizeAdmin, async (req, res) => {
    try {
      const date =
        req.query.date ||
        new Date().toISOString().split("T")[0]; // today

      const filePath = await eveningDailyAttendanceReport(date);

      res.download(filePath);

    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Failed to generate report"
      });
    }
  }
);

module.exports = router;
