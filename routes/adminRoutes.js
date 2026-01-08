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
      let {
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

      email = email.toLowerCase();
      username = username.toLowerCase();

      const allowedRoles = ["ADMIN", "EMPLOYEE"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role"
        });
      }

      // check duplicates
      const { data: existing } = await supabase
        .from("employees")
        .select("id")
        .or(`email.eq.${email},username.eq.${username}`)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email or username already exists"
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const employeeCode = `EMP-${crypto.randomUUID().slice(0, 8)}`;

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
        console.error("Create employee failed:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to create employee"
        });
      }

      res.json({
        success: true,
        message: "Employee created successfully"
      });

    } catch (err) {
      console.error("Create employee error:", err);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);


router.get("/employees", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, email, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch employees failed:", error);
      return res.status(500).json({ error: "Failed to fetch employees" });
    }

    res.json({ success: true, data });

  } catch (err) {
    console.error("Get employees error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



router.post("/update-employee", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id, name, email, password, role, is_active } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Employee id is required" });
    }

    const update = {};

    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (role !== undefined) update.role = role;
    if (is_active !== undefined) update.is_active = is_active;

    if (password) {
      update.password_hash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { error } = await supabase
      .from("employees")
      .update(update)
      .eq("id", id);

    if (error) {
      console.error("Employee update failed:", error);
      return res.status(500).json({ error: "Failed to update employee" });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Update employee error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



router.post("/delete-employee", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Employee id is required" });
    }

    // prevent admin deleting themselves
    if (req.user.employeeId === id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete employee failed:", error);
      return res.status(500).json({ error: "Failed to delete employee" });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Delete employee error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



module.exports = router;
