/**
 * Calculate working hours from login sessions
 */
function calculateWorkingHours(sessions) {
  let totalMs = 0;
 (sessions || []).forEach(s => {
    if (s.login_time && s.logout_time) {
      totalMs += new Date(s.logout_time) - new Date(s.login_time);
    }
  });
  return (totalMs / (1000 * 60 * 60)).toFixed(2);
}


/**
 * Get IST day window converted to UTC
 */
function getISTDayWindowUTC(startISTDate, endISTDate) { 
  const startIST = new Date(startISTDate);
  const endIST = new Date(endISTDate);
  const offset = 5.5 * 60 * 60 * 1000;

  return {
    startUTC: new Date(startIST.getTime() - offset).toISOString(),
    endUTC: new Date(endIST.getTime() - offset).toISOString()
  };
}

/**
 * Get today's date in IST (YYYY-MM-DD)
 */
function getTodayISTDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata"
  });
}

module.exports = {
  getISTDayWindowUTC,
  calculateWorkingHours,
  getTodayISTDate
};