const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../supabaseClient");
const authenticate = require("../middleware/authMiddleware");
const {sendMail} = require("../utils/emailService");
const { loginEmailTemplate } = require("../utils/emailTemplates");
 const { logoutEmailTemplate } = require("../utils/emailTemplates");



router.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    const { data: employee, error } = await supabase
      .from("employees")
      .select("id, name, username, password_hash, role, is_active")
      .or(`username.eq.${username},email.eq.${username}`)
      .eq("is_active", true)
      .single();

    if (error || !employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, employee.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // JWT
    const token = jwt.sign(
      {
        employeeId: employee.id,
        role: employee.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const nowUTC = new Date().toISOString();

    // Login log (AUDIT ONLY)
    await supabase.from("login_logs").insert({
      employee_id: employee.id,
      login_time: nowUTC,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"] || null
    });

    // Attendance logic
    const todayIST = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });

    // Check existing attendance
    const { data: existingAttendance } = await supabase
      .from("attendance")
      .select("id, first_login_time")
      .eq("employee_id", employee.id)
      .eq("attendance_date", todayIST)
      .single();

    if (!existingAttendance) {
      // FIRST login of the day
      await supabase.from("attendance").insert({
        employee_id: employee.id,
        attendance_date: todayIST,
        first_login_time: nowUTC,
        status: "Present" // later you can compute Late here
      });
    }

    return res.json({
      success: true,
      message: "Login successful",
      token,
      employee: {
        name: employee.name,
        role: employee.role
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});




// router.post("/logout", authenticate, async (req, res) => {
//   try {
//     const employeeId = req.user.employeeId;

//     // 1. Get employee details
//     const { data: employee, error: empError } = await supabase
//       .from("employees")
//       .select("id, name, username, manager_email")
//       .eq("id", employeeId)
//       .single();

//     if (empError || !employee) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found"
//       });
//     }

//     // 2. Get active login session
//     const { data: activeLog } = await supabase
//       .from("login_logs")
//       .select("id, login_time")
//       .eq("employee_id", employee.id)
//       .is("logout_time", null)
//       .order("login_time", { ascending: false })
//       .limit(1)
//       .single();

//     if (!activeLog) {
//       return res.status(400).json({
//         success: false,
//         message: "No active login session found"
//       });
//     }

//     // 3. Update logout time
//     const logoutTime = new Date();

//     await supabase
//       .from("login_logs")
//       .update({ logout_time: logoutTime })
//       .eq("id", activeLog.id);

//     // 4. Send manager email
// //     if (employee.manager_email) {


// // await sendMail(
// //   employee.manager_email,
// //   `Employee Logout Notification – ${employee.name}`,
// //   logoutEmailTemplate({
// //     employeeName: employee.name,
// //     username: employee.username,
// //     loginTime: new Date(activeLog.login_time).toLocaleString(),
// //     logoutTime: new Date().toLocaleString()
// //   })
// // );

// //     }

//     return res.json({
//       success: true,
//       message: "Logout successful"
//     });

//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// });



router.post("/logout", authenticate, async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const nowUTC = new Date().toISOString();

    // Close ONLY latest active login
    const { data: activeLog } = await supabase
      .from("login_logs")
      .select("id")
      .eq("employee_id", employeeId)
      .is("logout_time", null)
      .order("login_time", { ascending: false })
      .limit(1)
      .single();

    if (!activeLog) {
      return res.status(400).json({
        success: false,
        message: "No active session found"
      });
    }

    await supabase
      .from("login_logs")
      .update({
        logout_time: nowUTC,
        logout_type: "manual"
      })
      .eq("id", activeLog.id);

    // Update attendance last logout
    const todayIST = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });

    await supabase
      .from("attendance")
      .update({
        last_logout_time: nowUTC
      })
      .eq("employee_id", employeeId)
      .eq("attendance_date", todayIST);

    return res.json({
      success: true,
      message: "Logout successful"
    });

  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


router.get("/employee-session-status", authenticate, async (req, res) => {
  try {
    const employeeId = req.user.employeeId;

    const { data, error } = await supabase
      .from("login_logs")
      .select("login_time, logout_time, logout_type")
      .eq("employee_id", employeeId)
      .order("login_time", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.json({
        success: true,
        session: null
      });
    }

    res.json({
      success: true,
      session: data
    });

  } catch (err) {
    console.error("Session status error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch session status"
    });
  }
});




module.exports = router;
