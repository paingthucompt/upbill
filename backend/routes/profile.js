const express = require("express");
const bcrypt = require("bcryptjs");
const { query } = require("../db");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/profile/me - Get current user profile
router.get("/profile/me", protect, async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    res.json({
      id: user.id,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/profile/me - Update user profile (email only for now)
router.put("/profile/me", protect, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if email is already taken by another user
    const { rows: existingUsers } = await query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email, req.userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Email is already taken" });
    }

    // Update the user's email
    const { rows } = await query(
      "UPDATE users SET email = $1 WHERE id = $2 RETURNING id, email, role",
      [email, req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: rows[0]
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/profile/change-password - Change user password
router.post("/profile/change-password", protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Old password and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters long" 
      });
    }

    // Fetch current password hash
    const { rows } = await query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // Check if old password is correct
    const passwordMatches = await bcrypt.compare(oldPassword, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password in database
    await query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [hashedNewPassword, req.userId]
    );

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;