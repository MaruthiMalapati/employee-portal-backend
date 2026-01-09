


const cron = require("node-cron");
const generateReport = require("../reports/dailyAttendanceReport");
const { sendMailWithAttachment } = require("../utils/emailService");
const attendanceTemplate = require("../utils/attendanceEmailTemplate");

/**
 * Get today's date in IST (YYYY-MM-DD)
 */
function getTodayISTDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata"
  });
}

const MANAGER_EMAILS = process.env.MANAGER_EMAILS;
const recipients = MANAGER_EMAILS.split(",").map(e => e.trim());

/**
 * 6:35 PM IST = 13:05 UTC
 */
cron.schedule("5 13 * * *", async () => {
  try {
    console.log("📧 Running evening attendance email job");

    const todayIST = getTodayISTDate();

    const filePath = await generateReport(todayIST);

    await sendMailWithAttachment(
      recipients,
      `Daily Attendance Report – ${todayIST}`,
      attendanceTemplate(todayIST),
      filePath
    );

    console.log("✅ Evening attendance email sent successfully");

  } catch (err) {
    console.error("❌ Evening attendance email failed:", err);
  }
});
