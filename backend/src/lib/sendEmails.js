import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config()

const {EMAIL_USER,EMAIL_PASS}=process.env;

/**
 * Sends an email using Nodemailer and Gmail service.
 * @param {Object} options
 * @param {string} options.to - Recipient iimeel
 * @param {string} options.subject - Iimeel subject
 * @param {string} options.text - Raw text body
 * @param {string} [options.html] - Optional HTML body
 * @returns {Promise<any>}
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || EMAIL_USER,
      pass: process.env.EMAIL_PASS || EMAIL_PASS
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER || EMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
};

export const sendOtpEmail = async (to, otp) => {
  const subject = "Your Verification OTP - AgriConnect";
  const text = `Your OTP verification code is: ${otp}. It will expire in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2e7d32; text-align: center;">AgriConnect Verification</h2>
      <p>Haye, fadlan isticmaal koodhkan hoose si aad u dhameystirto is-dhaqaajintaada (Registration):</p>
      <div style="background-color: #f1f8e9; padding: 15px; text-align: center; border-radius: 6px; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #1b5e20;">
        ${otp}
      </div>
      <p style="margin-top: 15px; color: #666; font-size: 13px;">Koodhkan wuxuu dhacayaa 10 daqiiqo ka dib. Weligaa cidna ha u sheegin.</p>
    </div>
  `;
  return sendEmail({ to, subject, text, html });
};

export const sendForgotPasswordEmail = async (to, newPassword) => {
  const subject = "Your New Password - AgriConnect";
  const text = `Your new temporary password is: ${newPassword}. Please log in and change your password.`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2e7d32; text-align: center;">AgriConnect Password Reset</h2>
      <p>Password-kaagii waa la baddalay. Waxaad hadda ku soo geli kartaa password-kan cusub oo 6-digit ah:</p>
      <div style="background-color: #e8f5e9; padding: 15px; text-align: center; border-radius: 6px; font-size: 26px; font-weight: bold; letter-spacing: 4px; color: #2e7d32;">
        ${newPassword}
      </div>
      <p style="margin-top: 15px; color: #666; font-size: 13px;">Fadlan markaad soo gasho profilkaaga ka baddalo password-kan si uu ammaan kuugu noqdo.</p>
    </div>
  `;
  return sendEmail({ to, subject, text, html });
};