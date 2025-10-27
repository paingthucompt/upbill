const express = require("express");
const { query } = require("../db");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/analytics/dashboard - Get dashboard analytics for current user
router.get("/analytics/dashboard", protect, async (req, res) => {
  try {
    // Get analytics data for the logged-in user from transactions table
    const { rows } = await query(
      `SELECT 
        COALESCE(SUM(incoming_amount_thb), 0) as totalIncome,
        COALESCE(SUM(payout_amount), 0) as totalPayout,
        COALESCE(SUM(commission_amount), 0) as totalCommission,
        COUNT(*) as totalTransactions
       FROM transactions 
       WHERE user_id = $1`,
      [req.userId]
    );

    const analytics = rows[0];

    // Also get user's subscription payment data
    const { rows: paymentRows } = await query(
      `SELECT 
        COALESCE(SUM(amount), 0) as totalSubscriptionPayments,
        COUNT(*) as paymentCount
       FROM subscription_payments 
       WHERE user_id = $1 AND status = 'completed'`,
      [req.userId]
    );

    const payments = paymentRows[0];

    res.json({
      totalIncome: parseFloat(analytics.totalincome || 0),
      totalPayout: parseFloat(analytics.totalpayout || 0),
      totalCommission: parseFloat(analytics.totalcommission || 0),
      totalTransactions: parseInt(analytics.totaltransactions || 0),
      totalSubscriptionPayments: parseFloat(payments.totalsubscriptionpayments || 0),
      paymentCount: parseInt(payments.paymentcount || 0)
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/analytics/admin - Get admin analytics (admin only)
router.get("/analytics/admin", protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Get total user count
    const { rows: userRows } = await query(
      "SELECT COUNT(*) as totalUsers FROM users"
    );

    // Get active subscribers count from users table (using subscription_status)
    const { rows: subscriberRows } = await query(
      `SELECT COUNT(*) as activeSubscribers 
       FROM users 
       WHERE subscription_status = 'active' 
       AND (subscription_end_date IS NULL OR subscription_end_date > NOW())`
    );

    // Get total revenue from subscription payments
    const { rows: revenueRows } = await query(
      `SELECT 
        COALESCE(SUM(amount), 0) as totalRevenue,
        COUNT(*) as totalPayments
       FROM subscription_payments 
       WHERE status = 'completed'`
    );

    // Get overall transaction statistics
    const { rows: transactionRows } = await query(
      `SELECT 
        COALESCE(SUM(incoming_amount_thb), 0) as totalSystemIncome,
        COALESCE(SUM(commission_amount), 0) as totalSystemCommission,
        COUNT(*) as totalSystemTransactions,
        COUNT(DISTINCT user_id) as activeUsers
       FROM transactions`
    );

    const userStats = userRows[0];
    const subscriberStats = subscriberRows[0];
    const revenueStats = revenueRows[0];
    const transactionStats = transactionRows[0];

    res.json({
      totalUsers: parseInt(userStats.totalusers || 0),
      activeSubscribers: parseInt(subscriberStats.activesubscribers || 0),
      totalRevenue: parseFloat(revenueStats.totalrevenue || 0),
      totalPayments: parseInt(revenueStats.totalpayments || 0),
      totalSystemIncome: parseFloat(transactionStats.totalsystemincome || 0),
      totalSystemCommission: parseFloat(transactionStats.totalsystemcommission || 0),
      totalSystemTransactions: parseInt(transactionStats.totalsystemtransactions || 0),
      activeUsers: parseInt(transactionStats.activeusers || 0)
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/analytics/monthly - Get monthly analytics for charts
router.get("/analytics/monthly", protect, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT 
        DATE_TRUNC('month', transaction_date) as month,
        COALESCE(SUM(incoming_amount_thb), 0) as income,
        COALESCE(SUM(payout_amount), 0) as payout,
        COALESCE(SUM(commission_amount), 0) as commission,
        COUNT(*) as transactionCount
       FROM transactions 
       WHERE user_id = $1 
       AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
       GROUP BY DATE_TRUNC('month', transaction_date)
       ORDER BY month ASC`,
      [req.userId]
    );

    const monthlyData = rows.map(row => ({
      month: new Date(row.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      income: parseFloat(row.income || 0),
      payout: parseFloat(row.payout || 0),
      commission: parseFloat(row.commission || 0),
      transactionCount: parseInt(row.transactioncount || 0)
    }));

    res.json(monthlyData);
  } catch (error) {
    console.error("Monthly analytics error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;