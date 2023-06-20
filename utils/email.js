'use strict';
const nodemailer = require('nodemailer');
const postmarkTransport = require('nodemailer-postmark-transport');

const sendEmail = async (options) => {
  // 1) create reusable transporter object using the default SMTP service
  // postmark transporter
  const transporter = nodemailer.createTransport(
    postmarkTransport({
      auth: {
        apiKey: process.env.EMAIL_API_KEY,
      },
    })
  );

  /* 
  const transporter = nodemailer.createTransport({
    // enter authentication and email server details
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    // secure: false, // ture for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  }); 
  */

  // 2) define the email options (actual email to be sent)
  const mailOptions = {
    from: process.env.EMAIL_DEFAULT_SENDER,
    to: options.email, // list of receivers
    subject: options.subject, // subject line
    text: options.message, // plain text body
    html: options.htmlMSG, // html body
  };
  // 3) actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
