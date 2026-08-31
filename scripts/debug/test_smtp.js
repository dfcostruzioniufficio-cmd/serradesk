import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config({ path: '.env.vercel' });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 465,
  secure: true, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP CONNECTION ERROR:", error.message);
    if (error.response) console.error("SMTP RESPONSE:", error.response);
  } else {
    console.log("Server is ready to take our messages");
  }
});
