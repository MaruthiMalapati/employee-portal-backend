// const ExcelJS = require("exceljs");
// const supabase = require("../supabaseClient");

// async function generateMorningAttendanceReport(date) {
//   const workbook = new ExcelJS.Workbook();
//   const sheet = workbook.addWorksheet("Morning Attendance");

//   sheet.columns = [
//     { header: "Employee Code", key: "employee_code", width: 18 },
//     { header: "Employee Name", key: "name", width: 25 },
//     { header: "Login Time", key: "login_time", width: 25 },
//     { header: "Status", key: "status", width: 15 }
//   ];

//   // Get all employees
//   const { data: employees, error: empErr } = await supabase
//     .from("employees")
//     .select("id, employee_code, name")
//     .eq("is_active", true);

//   if (empErr) throw empErr;

//   // Get today's login logs
//   const { data: logs, error: logErr } = await supabase
//     .from("login_logs")
//     .select("employee_id, login_time")
//     .eq("login_time::date", date);

//   if (logErr) throw logErr;

//   // Map employee_id -> login_time
//   const loginMap = {};
//   logs.forEach(l => {
//     // If multiple logins exist, keep first one
//     if (!loginMap[l.employee_id]) {
//       loginMap[l.employee_id] = l.login_time;
//     }
//   });

//   employees.forEach(emp => {
//     const loginTime = loginMap[emp.id];

//     sheet.addRow({
//       employee_code: emp.employee_code,
//       name: emp.name,
//       login_time: loginTime
//         ? new Date(loginTime).toLocaleString()
//         : "—",
//       status: loginTime ? "Present" : "Absent"
//     });
//   });

//   const fileName = `Morning-Attendance-${date}.xlsx`;
//   await workbook.xlsx.writeFile(fileName);

//   return fileName;
// }

// module.exports = generateMorningAttendanceReport;


const ExcelJS = require("exceljs");
const supabase = require("../supabaseClient");

async function generateMorningAttendanceReport(date) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Morning Attendance");

  sheet.columns = [
    { header: "Employee Code", key: "employee_code", width: 18 },
    { header: "Name", key: "name", width: 25 },
    { header: "Login Time", key: "login_time", width: 20 },
    { header: "Status", key: "status", width: 15 }
  ];

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_code, name")
    .eq("is_active", true);

  const { data: logs } = await supabase
    .from("login_logs")
    .select("employee_id, login_time")
    .eq("login_time::date", date);

  const loginMap = {};
  logs.forEach(l => {
    if (!loginMap[l.employee_id]) {
      loginMap[l.employee_id] = l.login_time;
    }
  });

  employees.forEach(emp => {
    const loginTime = loginMap[emp.id];

    sheet.addRow({
      employee_code: emp.employee_code,
      name: emp.name,
      login_time: loginTime
        ? new Date(loginTime).toLocaleTimeString()
        : "—",
      status: loginTime ? "Present" : "Absent"
    });
  });

  const fileName = `Morning-Attendance-${date}.xlsx`;
  await workbook.xlsx.writeFile(fileName);
  return fileName;
}

module.exports = generateMorningAttendanceReport;
