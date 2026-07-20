const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Store OTPs temporarily
const otpStore = {};

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Test Route
app.get("/", (req, res) => {
  res.send("✅ EcoChoice OTP Server is Running!");
});

// =========================
// SEND OTP
// =========================
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  const otp = generateOTP();

  // Save OTP for 5 minutes
  otpStore[email] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000,
  };

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Eco Choice" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "EcoChoice Verification Code",
      html: `
        <div style="font-family:Arial,sans-serif;text-align:center;">
          <h2>EcoChoice Email Verification</h2>

          <p>Your verification code is:</p>

          <h1 style="
              font-size:40px;
              letter-spacing:8px;
              color:#2E7D32;">
              ${otp}
          </h1>

          <p>This code expires in <strong>5 minutes</strong>.</p>

          <hr>

          <small>
          If you didn't request this verification code,
          you can safely ignore this email.
          </small>
        </div>
      `,
    });

    console.log(`OTP for ${email}: ${otp}`);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to send OTP.",
    });
  }
});

// =========================
// VERIFY OTP
// =========================
app.post("/verify-otp", (req, res) => {
  console.log("VERIFY ROUTE HIT!");
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required.",
    });
  }

  const record = otpStore[email];

  if (!record) {
    return res.status(400).json({
      success: false,
      message: "No OTP found. Please request a new code.",
    });
  }

  if (Date.now() > record.expires) {
    delete otpStore[email];

    return res.status(400).json({
      success: false,
      message: "OTP has expired.",
    });
  }

  if (record.otp !== otp) {
    return res.status(400).json({
      success: false,
      message: "Incorrect OTP.",
    });
  }

  // OTP verified successfully
  delete otpStore[email];

  return res.status(200).json({
    success: true,
    message: "Email verified successfully.",
  });
});

// =========================
// START SERVER
// =========================
console.log("✅ Registering /send-otp");
console.log("✅ Registering /verify-otp");

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Accessible on your network at http://192.168.1.141:${PORT}`);
});