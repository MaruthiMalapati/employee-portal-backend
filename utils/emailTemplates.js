function loginEmailTemplate({ employeeName, username, loginTime }) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color:#315f86;">Employee Login Notification</h2>

      <p>Dear Manager,</p>

      <p>This is to inform you that the following employee has logged in to the Employee Portal.</p>

      <table style="border-collapse: collapse; margin-top: 10px;">
        <tr>
          <td style="padding: 6px 10px;"><strong>Name</strong></td>
          <td style="padding: 6px 10px;">${employeeName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px;"><strong>Username</strong></td>
          <td style="padding: 6px 10px;">${username}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px;"><strong>Login Time</strong></td>
          <td style="padding: 6px 10px;">${loginTime}</td>
        </tr>
      </table>

      <p style="margin-top: 15px;">
        This is an automated notification. No action is required.
      </p>

      <p>
        Regards,<br/>
        <strong>Employee Access System</strong>
      </p>

      <hr/>
      <small style="color:#777;">
        This email was generated automatically. Please do not reply.
      </small>
    </div>
  `;
}

function logoutEmailTemplate({ employeeName, username, loginTime, logoutTime }) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color:#315f86;">Employee Logout Notification</h2>

      <p>Dear Manager,</p>

      <p>The following employee has logged out of the Employee Portal.</p>

      <table style="border-collapse: collapse; margin-top: 10px;">
        <tr>
          <td style="padding: 6px 10px;"><strong>Name</strong></td>
          <td style="padding: 6px 10px;">${employeeName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px;"><strong>Username</strong></td>
          <td style="padding: 6px 10px;">${username}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px;"><strong>Login Time</strong></td>
          <td style="padding: 6px 10px;">${loginTime}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px;"><strong>Logout Time</strong></td>
          <td style="padding: 6px 10px;">${logoutTime}</td>
        </tr>
      </table>

      <p style="margin-top: 15px;">
        This is an automated notification. No action is required.
      </p>

      <p>
        Regards,<br/>
        <strong>Employee Access System</strong>
      </p>

      <hr/>
      <small style="color:#777;">
        This email was generated automatically. Please do not reply.
      </small>
    </div>
  `;
}

module.exports = {
  loginEmailTemplate,
  logoutEmailTemplate
};
