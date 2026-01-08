const express = require("express");
const bcrypt = require("bcryptjs");
const supabase = require("../supabaseClient");
const authenticate = require("../middleware/authMiddleware");
const authorizeAdmin = require("../middleware/authorizeAdmin");

const router = express.Router();

router.post(
  "/create-employee",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const {
        name,
        username,
        email,
        password,
        manager_email,
        role = "EMPLOYEE"
      } = req.body;

      if (!name || !username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields"
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);
const employeeCode = "EMP" + Date.now().toString().slice(-6);
      const { error } = await supabase.from("employees").insert({
        employee_code: employeeCode,
        name,
        username,
        email,
        password_hash: passwordHash,
        manager_email,
        role,
        is_active: true
      });

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.json({
        success: true,
        message: "Employee created successfully"
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }
);

module.exports = router;
