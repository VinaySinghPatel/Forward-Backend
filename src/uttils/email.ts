import nodemailer from "nodemailer";

export const sendOtpEmail = async (
  to: string,
  otp: string
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, 
    },
  });

  await transporter.sendMail({
    from: `"Forward App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your account",
    html: `
      <h2>Account Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  });
};
