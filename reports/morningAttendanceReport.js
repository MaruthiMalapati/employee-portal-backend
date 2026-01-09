const ExcelJS = require("exceljs");
const supabase = require("../supabaseClient");

/**
 * Get today's date in IST (YYYY-MM-DD)
 */
function getTodayISTDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata"
  });
}

/**
 * Format UTC time to IST (for Excel)
 */
function formatIST(date) {
  if (!date) return "—";

  return new Date(date).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

/**
 * Generate Morning Attendance Excel Report
 * Uses ATTENDANCE table (NO duplication)
 */
async function generateMorningReport() {
  try {
    const date = getTodayISTDate();
    console.log("📅 IST Attendance Date:", date);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Morning Attendance");

    sheet.columns = [
      { header: "Employee Code", key: "employee_code", width: 18 },
      { header: "Name", key: "name", width: 25 },
      { header: "Login Time", key: "login_time", width: 18 },
      { header: "Status", key: "status", width: 14 }
    ];

    /**
     * Fetch attendance for today
     * One row per employee (guaranteed by DB constraint)
     */
    const { data: attendance, error } = await supabase
      .from("attendance")
      .select(`
        status,
        first_login_time,
        employees (
          employee_code,
          name
        )
      `)
      .eq("attendance_date", date)
      .order("employees(employee_code)", { ascending: true });

    if (error) throw error;

    // Fill Excel rows
    attendance.forEach(row => {
      sheet.addRow({
        employee_code: row.employees.employee_code,
        name: row.employees.name,
        login_time: row.first_login_time
          ? formatIST(row.first_login_time)
          : "—",
        status: row.status
      });
    });

    const fileName = `Morning-Attendance-${date}.xlsx`;
    await workbook.xlsx.writeFile(fileName);

    console.log("✅ Morning attendance report generated:", fileName);
    return fileName;

  } catch (err) {
    console.error("❌ Attendance report error:", err);
    throw err;
  }
}

module.exports = generateMorningReport;
