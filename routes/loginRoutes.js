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

    // 1. Fetch employee (username OR email)
    const { data: employee, error } = await supabase
      .from("employees")
      .select("id, name, username, email, password_hash, manager_email, role, is_active")
      .or(`username.eq.${username},email.eq.${username}`)
      .eq("is_active", true)
      .single();

      

    if (error || !employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, employee.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // 3. CREATE TOKEN (THIS WAS MISSING / MISPLACED)
    const token = jwt.sign(
      {
        employeeId: employee.id,
        username: employee.username,
        role: employee.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // 4. Log login
await supabase.from("login_logs").insert({
  employee_id: employee.id,
  login_time: new Date().toISOString(), // ALWAYS UTC
  ip_address: req.ip,
  user_agent: req.headers["user-agent"] || null
});


    // 5. Send login email (optional, keep if already added)
    // if (employee.manager_email) {
    //   const loginTime = new Date().toLocaleString();
    //   await sendMail(
    //     employee.manager_email,
    //     `Employee Login Notification – ${employee.name}`,
    //     loginEmailTemplate({
    //       employeeName: employee.name,
    //       username: employee.username,
    //       loginTime
    //     })
    //   );
    // }

    // 6. RESPONSE (token NOW EXISTS)
    return res.json({
      success: true,
      message: "Login successful",
      token,
      employee: {
        name: employee.name,
        username: employee.username,
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

    // Close latest active session
    const { data, error } = await supabase
      .from("login_logs")
      .update({
        logout_time: new Date().toISOString(), // UTC
        logout_type: "manual"
      })
      .eq("employee_id", employeeId)
      .is("logout_time", null);

    if (error) {
      console.error("Logout update error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to logout"
      });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active session found"
      });
    }
       // 4. Send manager email
//     if (employee.manager_email) {


// await sendMail(
//   employee.manager_email,
//   `Employee Logout Notification – ${employee.name}`,
//   logoutEmailTemplate({
//     employeeName: employee.name,
//     username: employee.username,
//     loginTime: new Date(activeLog.login_time).toLocaleString(),
//     logoutTime: new Date().toLocaleString()
//   })
// );

//     }


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
