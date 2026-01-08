const cron = require("node-cron");
const supabase = require("../supabaseClient");

cron.schedule("30 18 * * *", async () => {
  try {
    console.log("Running auto logout job at 6:30 PM");

    const logoutTime = new Date();

    // Find all active login sessions (no logout_time)
    const { data: activeSessions, error } = await supabase
      .from("login_logs")
      .select("id")
      .is("logout_time", null);

    if (error) throw error;

    if (!activeSessions || activeSessions.length === 0) {
      console.log("No active sessions to logout");
      return;
    }

    // Update logout_time for all active sessions
    for (const session of activeSessions) {
      await supabase
        .from("login_logs")
        .update({ logout_time: logoutTime })
        .eq("id", session.id);
    }

    console.log(`Auto logout completed for ${activeSessions.length} sessions`);

  } catch (err) {
    console.error("Auto logout failed:", err);
  }
});
