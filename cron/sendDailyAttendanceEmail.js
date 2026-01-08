const cron = require("node-cron");
const generateReport = require("../reports/dailyAttendanceReport");
const {sendMailWithAttachment } = require("../utils/emailService");
const attendanceTemplate = require("../utils/attendanceEmailTemplate");

const MANAGER_EMAIL = process.env.MANAGER_EMAIL;

cron.schedule("35 18 * * *", async () => {
  try {
    console.log("Running daily attendance email job");

    const today = new Date().toISOString().split("T")[0];

    const filePath = await generateReport(today);

    await sendMailWithAttachment(
      MANAGER_EMAIL,
      `Daily Attendance Report – ${today}`,
      attendanceTemplate(today),
      filePath
    );

    console.log("Attendance email sent successfully");

  } catch (err) {
    console.error("Attendance email failed:", err);
  }
});
