const cron = require("node-cron");
const generateReport = require("../reports/dailyAttendanceReport");
const {sendMailWithAttachment } = require("../utils/emailService");
const attendanceTemplate = require("../utils/attendanceEmailTemplate");

const MANAGER_EMAILS = process.env.MANAGER_EMAILS;
const recipients = MANAGER_EMAILS.split(",").map(e => e.trim());

cron.schedule("35 18 * * *", async () => {
  try {
    console.log("Running daily attendance email job");

    const today = new Date().toISOString().split("T")[0];

    const filePath = await generateReport(today);

    await sendMailWithAttachment(
      recipients,
      `Daily Attendance Report – ${today}`,
      attendanceTemplate(today),
      filePath
    );

    console.log("Attendance email sent successfully");

  } catch (err) {
    console.error("Attendance email failed:", err);
  }
});
