const cron = require("node-cron");
const generateMorningReport = require("../reports/morningAttendanceReport");
const { sendMailWithAttachment } = require("../utils/emailService");
const attendanceTemplate = require("../utils/attendanceEmailTemplate");
const fs = require("fs");
const MANAGER_EMAILS = process.env.MANAGER_EMAILS;
const recipients = MANAGER_EMAILS.split(",").map(e => e.trim());

            // ┌──────── minute (0–59) example: 0,15,30,45
            // │  ┌───── hour (0–23) example: 0,13,23
            // │  │  ┌─── day of month (1–31) example: 1,15
            // │  │  │ ┌─ month (1–12) or jan–dec example: jan, mar, jul or 1,3,7
            // │  │  │ │ ┌─ day of week (0–6) (sun–sat) 1-5 example: 1-5 means Mon-Fri
            // │  │  │ │ │
            // 30 10 * * *    // 30 minutes past 10 AM every day 

cron.schedule("30 10 * * *", async () => {
  try {
    console.log("Running morning attendance report");

    const today = new Date().toISOString().split("T")[0];

    const filePath = await generateMorningReport(today);

    await sendMailWithAttachment(
      recipients,
      `Morning Attendance Report – ${today}`,
      attendanceTemplate(today),
      filePath
    );
    if (fs.existsSync(filePath)) {
  fs.unlinkSync(filePath);
}

    console.log("Morning attendance cron job completed successfully & Morning attendance email sent");

  } catch (err) {
    console.error("Morning attendance failed:", err);
  }
},  {
    timezone: "Asia/Kolkata"
  }
);
