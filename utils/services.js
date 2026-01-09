function calculateWorkingHours(sessions) {
  let totalMs = 0;
  sessions.forEach(s => {
    if (s.login_time && s.logout_time) {
      totalMs += new Date(s.logout_time) - new Date(s.login_time);
    }
  });
  return (totalMs / (1000 * 60 * 60)).toFixed(2);
}

function getISTDayWindowUTC(date) {
  const startIST = new Date(`${date}T00:00:00`);
  const endIST = new Date(`${date}T23:59:59`);
  const offset = 5.5 * 60 * 60 * 1000;

  return {
    startUTC: new Date(startIST.getTime() - offset).toISOString(),
    endUTC: new Date(endIST.getTime() - offset).toISOString()
  };
}

module.exports = {
  getISTDayWindowUTC,
  calculateWorkingHours
};