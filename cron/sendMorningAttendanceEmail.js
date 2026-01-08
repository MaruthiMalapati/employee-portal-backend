const cron = require("node-cron");
const generateMorningReport = require("../reports/morningAttendanceReport");
const { sendMailWithAttachment } = require("../utils/emailService");
const attendanceTemplate = require("../utils/attendanceEmailTemplate");

const MANAGER_EMAIL = process.env.MANAGER_EMAIL;

cron.schedule("10 10 * * *", async () => {
  try {
    console.log("Running morning attendance report");

    const today = new Date().toISOString().split("T")[0];

    const filePath = await generateMorningReport(today);

    await sendMailWithAttachment(
      MANAGER_EMAIL,
      `Morning Attendance Report – ${today}`,
      attendanceTemplate(today),
      filePath
    );

    console.log("Morning attendance email sent");

  } catch (err) {
    console.error("Morning attendance failed:", err);
  }
});
