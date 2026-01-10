



const ExcelJS = require("exceljs");
const supabase = require("../supabaseClient");
const {getISTDayWindowUTC, calculateWorkingHours} = require("../utils/services");
function formatIST(date) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}


async function generateEveningDailyAttendanceReport(date) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Daily Attendance");

  sheet.columns = [
    { header: "Employee Code", key: "employee_code", width: 18 },
    { header: "Name", key: "name", width: 25 },
    { header: "Login Time", key: "login_time", width: 18 },
    { header: "Logout Time", key: "logout_time", width: 18 },
    { header: "Working Hours", key: "hours", width: 16 },
    { header: "Status", key: "status", width: 14 }
  ];

  const startISTDate = `${date}T00:00:00`;
  const endISTDate = `${date}T23:59:59`;
  const { startUTC, endUTC } = getISTDayWindowUTC(startISTDate, endISTDate);

  // 1️⃣ Attendance rows (one per employee)
  const { data: attendance } = await supabase
    .from("attendance")
    .select(`
      employee_id,
      status,
      first_login_time,
      last_logout_time,
      employees ( employee_code, name )
    `)
    .eq("attendance_date", date);

  // 2️⃣ Login sessions for the day
  const { data: logs } = await supabase
    .from("login_logs")
    .select("employee_id, login_time, logout_time")
    .gte("login_time", startUTC)
    .lte("login_time", endUTC);

  // Group sessions by employee
  const sessionsByEmployee = {};
  logs.forEach(log => {
    if (!sessionsByEmployee[log.employee_id]) {
      sessionsByEmployee[log.employee_id] = [];
    }
    sessionsByEmployee[log.employee_id].push(log);
  });

  // Build Excel rows
  attendance.forEach(row => {
    const sessions = sessionsByEmployee[row.employee_id] || [];
    const hours = calculateWorkingHours(sessions);

    sheet.addRow({
      employee_code: row.employees.employee_code,
      name: row.employees.name,
      login_time: formatIST(row.first_login_time),
      logout_time: formatIST(row.last_logout_time),
      hours,
      status: row.status
    });
  });

  const fileName = `Daily-Attendance-${date}.xlsx`;
  await workbook.xlsx.writeFile(fileName);
  return fileName ;
}

module.exports = generateEveningDailyAttendanceReport;
