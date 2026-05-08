const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");
import { Admin, User } from "../models";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken";
require("dotenv").config();
export interface GoogleLoginDTO {
  google_token: string;
}

const sendOTPEmail = async (email: string, otp: string) => {
  try {
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const { token } = await oauth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_FROM,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: token,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Mã OTP đặt lại mật khẩu",
      html: `
        <h1>Đặt lại mật khẩu</h1>
        <p>Mã OTP của bạn là: <strong>${otp}</strong></p>
        <p>Mã có hiệu lực trong 5 phút.</p>
      `,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export const loginWithGoogle = async (data: GoogleLoginDTO) => {
  const { google_token } = data;
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  if (!google_token || typeof google_token !== "string") {
    throw new Error("ID Token không hợp lệ");
  }

  // --------------------------
  // Verify token Google
  // --------------------------
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: google_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error("Google token invalid:", error);
    throw new Error("Token Google không hợp lệ");
  }

  if (!payload?.email || !payload.sub) {
    throw new Error("Google payload không hợp lệ");
  }

  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name || email.split("@")[0];
  const avatar = payload.picture || null;

  // --------------------------
  // Tìm user theo email
  // --------------------------
  let user = await User.findOne({ where: { email }, raw: false });

  if (user) {
    if (user.google_id) {
      // Email đã liên kết Google → kiểm tra google_id
      if (user.google_id !== googleId) {
        throw new Error(
          "Google account không khớp với tài khoản đã đăng ký. Vui lòng kiểm tra lại."
        );
      }
      // Nếu trùng, cho phép login
    } else {
      // Email đã tồn tại nhưng chưa liên kết Google → không gắn trực tiếp
      throw new Error(
        "Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu trước đó và liên kết Google."
      );
    }
  } else {
    // Chưa có email → tạo user mới
    user = await User.create({
      username: name,
      email,
      password_hash: null,
      avatar_url: avatar,
      gender: "other",
      google_id: googleId,
      is_active: true,
    });
  }

  // --------------------------
  // Kiểm tra tài khoản active
  // --------------------------
  if (!user.is_active) {
    throw new Error("Tài khoản đã bị vô hiệu hóa");
  }

  // --------------------------
  // Xác định role (admin / user)
  // --------------------------
  const role = "user";

  // --------------------------
  // Tạo token JWT
  // --------------------------
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET chưa cấu hình trên server");
  }

  const accessToken = generateAccessToken(user.id, role);
  const refreshToken = generateRefreshToken(user.id);

  // --------------------------
  // Trả về user + token
  // --------------------------
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatar_url: user.avatar_url,
      role,
    },
    accessToken,
    refreshToken,
  };
};

export default sendOTPEmail;
