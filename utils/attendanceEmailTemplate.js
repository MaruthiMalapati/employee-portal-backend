function attendanceEmailTemplate(date) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color:#315f86;">Daily Attendance Summary</h2>

      <p>Dear Manager,</p>

      <p>
        Please find attached the <strong>daily attendance report</strong> 
        for <strong>${date}</strong>.
      </p>

      <p>
        The report includes login time, logout time, and total working hours 
        for all employees.
      </p>

      <p>
        Regards,<br/>
        <strong>Employee Attendance System</strong>
      </p>

      <hr/>
      <small>This is an automated email. Please do not reply.</small>
    </div>
  `;
}

module.exports = attendanceEmailTemplate;
