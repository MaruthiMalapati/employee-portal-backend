


const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// normal email
async function sendMail(to, subject, html) {
  await transporter.sendMail({
    from: `"Employee System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
}

// email with attachment
async function sendMailWithAttachment(to, subject, html, attachmentPath) {
  await transporter.sendMail({
    from: `"Employee System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments: [
      {
        filename: attachmentPath.split("/").pop(),
        path: attachmentPath
      }
    ]
  });
}

module.exports = {
  sendMail,
  sendMailWithAttachment
};
