


const ExcelJS = require("exceljs");
const supabase = require("../supabaseClient");

function formatIST(date) {
  try {
  return new Date(date).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}catch (err) {
    console.error("Time format error:", err);
    return "—";
  }
}
function istToUTC(date, hours, minutes) {
  const utc = new Date(`${date}T00:00:00Z`);
  utc.setUTCHours(hours - 5);
  utc.setUTCMinutes(minutes - 30);
  return utc;
}
async function generateMorningAttendanceReport(date) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Morning Attendance");

  sheet.columns = [
    { header: "Employee Code", key: "employee_code", width: 18 },
    { header: "Name", key: "name", width: 25 },
    { header: "Login Time", key: "login_time", width: 18 },
    { header: "Status", key: "status", width: 14 }
  ];

  // IST 10:10 AM converted to UTC
  // const cutoffIST = new Date(`${date}T10:10:00`);
  // const cutoffUTC = new Date(
  //   cutoffIST.toLocaleString("en-US", { timeZone: "UTC" })
  // );
  // 10:10 AM IST = 04:40 UTC
// const cutoffUTC = new Date(`${date}T04:40:00Z`);
const cutoffUTC = istToUTC(date, 10, 10); // 10:10 IST


  // All active employees
  const { data: employees, error: empErr } = await supabase
    .from("employees")
    .select("id, employee_code, name")
    .eq("is_active", true);

  if (empErr) throw empErr;

  // Login logs BEFORE cutoff time
  const { data: logs, error: logErr } = await supabase
    .from("login_logs")
    .select("employee_id, login_time")
    .lte("login_time", cutoffUTC.toISOString());

  if (logErr) throw logErr;

  // First login per employee
  const loginMap = {};
  logs.forEach(log => {
    if (
      !loginMap[log.employee_id] ||
      log.login_time < loginMap[log.employee_id]
    ) {
      loginMap[log.employee_id] = log.login_time;
    }
  });

  // Final sheet rows
  employees.forEach(emp => {
    const loginTime = loginMap[emp.id];

    sheet.addRow({
      employee_code: emp.employee_code,
      name: emp.name,
      login_time: loginTime ? formatIST(loginTime) : "—",
      status: loginTime ? "Present" : "Absent"
    });
  });

  const fileName = `Morning-Attendance-${date}.xlsx`;
  await workbook.xlsx.writeFile(fileName);
  return fileName;
}



module.exports = generateMorningAttendanceReport;
