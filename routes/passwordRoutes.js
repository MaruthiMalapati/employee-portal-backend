const express = require("express");
const crypto = require("crypto");
const supabase = require("../supabaseClient");
// const sendMail = require("../utils/emailService");
const { sendMail } = require("../utils/emailService");

const router = express.Router();

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const { data: employee } = await supabase
      .from("employees")
      .select("id, email")
      .eq("email", email)
      .single();

    // Always return success (security best practice)
    if (!employee) {
      return res.json({
        success: true,
        message: "If the email exists, reset link has been sent"
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await supabase
      .from("employees")
      .update({
        reset_token: resetToken,
        reset_token_expiry: tokenExpiry
      })
      .eq("id", employee.id);

    const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

    await sendMail(
      employee.email,
      "Password Reset Request",
      `
        <p>Dear Employee,</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>This link is valid for 15 minutes.</p>
        <p>If you did not request this, please ignore.</p>
      `
    );

    res.json({
      success: true,
      message: "If the email exists, reset link has been sent"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});




const bcrypt = require("bcryptjs");

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid request"
      });
    }

    const { data: employee } = await supabase
      .from("employees")
      .select("id, reset_token_expiry")
      .eq("reset_token", token)
      .single();

    if (
      !employee ||
      new Date(employee.reset_token_expiry) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Reset link expired or invalid"
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await supabase
      .from("employees")
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expiry: null
      })
      .eq("id", employee.id);

    res.json({
      success: true,
      message: "Password reset successful"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});







module.exports = router;
