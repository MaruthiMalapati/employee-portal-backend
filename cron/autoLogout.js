
const cron = require("node-cron");
const supabase = require("../supabaseClient");
const { getISTDayWindowUTC, calculateWorkingHours, getTodayISTDate } = require("../utils/services");

/**
 * Auto logout + finalize working hours
 * Runs every day at 6:30 PM IST
 */
cron.schedule("30 18 * * *", async () => {
    try {
      console.log("⏰ Running auto-logout cron (6:30 PM IST)");

      const nowUTC = new Date().toISOString();
      const todayIST = getTodayISTDate();


      const startISTDate = `${todayIST}T00:00:00`;
      const endISTDate = `${todayIST}T23:59:59`;
      const { startUTC, endUTC } = getISTDayWindowUTC(startISTDate, endISTDate);

      /**
       * 1️⃣ Auto-logout only TODAY's active sessions
       */
      const { error: logoutError } = await supabase
        .from("login_logs")
        .update({
          logout_time: nowUTC,
          logout_type: "auto"
        })
        .is("logout_time", null)
        .gte("login_time", startUTC)
        .lte("login_time", endUTC);

      if (logoutError) {
        console.error("❌ Auto logout failed:", logoutError);
        return;
      }

      /**
       * 2️⃣ Update attendance last_logout_time
       */
      const { error: attendanceLogoutError } = await supabase
        .from("attendance")
        .update({ last_logout_time: nowUTC })
        .eq("attendance_date", todayIST)
        .is("last_logout_time", null);

      if (attendanceLogoutError) {
        console.error("❌ Attendance logout update failed:", attendanceLogoutError);
        return;
      }

      /**
       * 3️⃣ Fetch today's login sessions
       */
      const { data: logs, error: logsError } = await supabase
        .from("login_logs")
        .select("employee_id, login_time, logout_time")
        .gte("login_time", startUTC)
        .lte("login_time", endUTC);

      if (logsError) {
        console.error("❌ Fetch login logs failed:", logsError);
        return;
      }

      /**
       * 4️⃣ Group sessions by employee
       */
      const sessionsByEmployee = {};
      (logs || []).forEach(log => {
        if (!sessionsByEmployee[log.employee_id]) {
          sessionsByEmployee[log.employee_id] = [];
        }
        sessionsByEmployee[log.employee_id].push(log);
      });

      /**
       * 5️⃣ Calculate & update working hours
       */
      const { data: attendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("employee_id")
        .eq("attendance_date", todayIST);

      if (attendanceError || !attendance) {
        console.error("❌ Fetch attendance failed:", attendanceError);
        return;
      }

      for (const row of attendance) {
        const sessions = sessionsByEmployee[row.employee_id] || [];
        const hours = calculateWorkingHours(sessions);

        await supabase
          .from("attendance")
          .update({ working_hours: hours })
          .eq("employee_id", row.employee_id)
          .eq("attendance_date", todayIST);
      }

      console.log("✅ Auto-logout cron job successfully done & working hours finalized successfully");

    } catch (err) {
      console.error("❌ Auto logout cron error:", err);
    }
  },
  {
    timezone: "Asia/Kolkata"
  }
);
