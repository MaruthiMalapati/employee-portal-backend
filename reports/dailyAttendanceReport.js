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
    { header: "Login Time", key: "login_time", width: 18 },
    { header: "Logout Time", key: "logout_time", width: 18 },
    { header: "Working Hours", key: "hours", width: 16 }
  ];

  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);

  const { data, error } = await supabase
    .from("login_logs")
    .select(`
      employee_id,
      login_time,
      logout_time,
      employees (
        employee_code,
        name
      )
    `)
    .gte("login_time", start.toISOString())
    .lte("login_time", end.toISOString());

  if (error) throw error;

  // 🔑 Group by employee
  const attendanceMap = {};

  data.forEach(row => {
    const id = row.employee_id;

    if (!attendanceMap[id]) {
      attendanceMap[id] = {
        employee_code: row.employees.employee_code,
        name: row.employees.name,
        firstLogin: row.login_time,
        lastLogout: row.logout_time
      };
    } else {
      if (row.login_time < attendanceMap[id].firstLogin) {
        attendanceMap[id].firstLogin = row.login_time;
      }
      if (row.logout_time > attendanceMap[id].lastLogout) {
        attendanceMap[id].lastLogout = row.logout_time;
      }
    }
  });

  // 🔑 Add clean rows
  Object.values(attendanceMap).forEach(emp => {
    sheet.addRow({
      employee_code: emp.employee_code,
      name: emp.name,
      login_time: formatIST(emp.firstLogin),
      logout_time: formatIST(emp.lastLogout),
      hours: calculateHours(emp.firstLogin, emp.lastLogout)
    });
  });

  const fileName = `Daily-Attendance-${date}.xlsx`;
  await workbook.xlsx.writeFile(fileName);
  return fileName;
}
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

function calculateHours(login, logout) {
  const diffMs = new Date(logout) - new Date(login);
  return (diffMs / (1000 * 60 * 60)).toFixed(2);
}



module.exports = generateDailyAttendanceReport;
