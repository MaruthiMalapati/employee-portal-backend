// // const ExcelJS = require("exceljs");
// // const supabase = require("../supabaseClient");

// // async function generateDailyAttendance(date) {
// //   const workbook = new ExcelJS.Workbook();
// //   const sheet = workbook.addWorksheet("Attendance");

// //   sheet.columns = [
// //     { header: "Employee Code", key: "employee_code", width: 15 },
// //     { header: "Name", key: "name", width: 20 },
// //     { header: "Login Time", key: "login_time", width: 25 },
// //     { header: "Logout Time", key: "logout_time", width: 25 },
// //     { header: "Working Hours", key: "hours", width: 15 }
// //   ];

// //   const { data } = await supabase
// //     .from("login_logs")
// //     .select(`
// //       login_time,
// //       logout_time,
// //       employees (
// //         employee_code,
// //         name
// //       )
// //     `)
// //     .gte("login_time", date + " 00:00:00")
// //     .lte("login_time", date + " 23:59:59");

// //   data.forEach(row => {
// //     const login = new Date(row.login_time);
// //     const logout = new Date(row.logout_time);
// //     const hours = ((logout - login) / (1000 * 60 * 60)).toFixed(2);

// //     sheet.addRow({
// //       employee_code: row.employees.employee_code,
// //       name: row.employees.name,
// //       login_time: login.toLocaleString(),
// //       logout_time: logout.toLocaleString(),
// //       hours
// //     });
// //   });

// //   const filePath = `attendance-${date}.xlsx`;
// //   await workbook.xlsx.writeFile(filePath);

// //   return filePath;
// // }

// // module.exports = generateDailyAttendance;


// const ExcelJS = require("exceljs");
// const supabase = require("../supabaseClient");

// async function generateDailyAttendanceReport(date) {
//   // date format: YYYY-MM-DD
//   const workbook = new ExcelJS.Workbook();
//   const sheet = workbook.addWorksheet("Daily Attendance");

//   sheet.columns = [
//     { header: "Employee Code", key: "employee_code", width: 18 },
//     { header: "Employee Name", key: "name", width: 25 },
//     { header: "Login Time", key: "login_time", width: 25 },
//     { header: "Logout Time", key: "logout_time", width: 25 },
//     { header: "Working Hours", key: "working_hours", width: 18 }
//   ];

//   const start = `${date} 00:00:00`;
//   const end = `${date} 23:59:59`;

//   const { data, error } = await supabase
//     .from("login_logs")
//     .select(`
//       login_time,
//       logout_time,
//       employees (
//         employee_code,
//         name
//       )
//     `)
//     .gte("login_time", start)
//     .lte("login_time", end);

//   if (error) {
//     throw error;
//   }

//   data.forEach(row => {
//     const login = new Date(row.login_time);
//     const logout = row.logout_time
//       ? new Date(row.logout_time)
//       : null;

//     let hours = "";
//     if (logout) {
//       hours = ((logout - login) / (1000 * 60 * 60)).toFixed(2);
//     }

//     sheet.addRow({
//       employee_code: row.employees.employee_code,
//       name: row.employees.name,
//       login_time: login.toLocaleString(),
//       logout_time: logout ? logout.toLocaleString() : "—",
//       working_hours: hours
//     });
//   });

//   const fileName = `Daily-Attendance-${date}.xlsx`;
//   await workbook.xlsx.writeFile(fileName);

//   return fileName;
// }

// module.exports = generateDailyAttendanceReport;



const ExcelJS = require("exceljs");
const supabase = require("../supabaseClient");

function calculateHours(login, logout) {
  const diffMs = new Date(logout) - new Date(login);
  return (diffMs / (1000 * 60 * 60)).toFixed(2);
}

async function generateDailyAttendanceReport(date) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Daily Attendance");

  sheet.columns = [
    { header: "Employee Code", key: "employee_code", width: 18 },
    { header: "Name", key: "name", width: 25 },
    { header: "Login Time", key: "login_time", width: 20 },
    { header: "Logout Time", key: "logout_time", width: 20 },
    { header: "Working Hours", key: "hours", width: 18 }
  ];

  const { data, error } = await supabase
    .from("login_logs")
    .select(`
      login_time,
      logout_time,
      employees (
        employee_code,
        name
      )
    `)
    .eq("login_time::date", date);

  if (error) throw error;

  data.forEach(row => {
    sheet.addRow({
      employee_code: row.employees.employee_code,
      name: row.employees.name,
      login_time: new Date(row.login_time).toLocaleTimeString(),
      logout_time: new Date(row.logout_time).toLocaleTimeString(),
      hours: calculateHours(row.login_time, row.logout_time)
    });
  });

  const fileName = `Daily-Attendance-${date}.xlsx`;
  await workbook.xlsx.writeFile(fileName);
  return fileName;
}

module.exports = generateDailyAttendanceReport;
