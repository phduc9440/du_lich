import jwt from "jsonwebtoken";

// Interface cho Access Token payload (chứa id và role)
export interface JWTPayload {
  id: number;
  role: 'user' | 'admin';
}

// Interface cho Refresh Token payload (chỉ chứa id, không có role)
export interface RefreshTokenPayload {
  id: number;
}

// Tạo access token với thời hạn 30 phút (chứa id và role)
export const generateAccessToken = (id: number, role: 'user' | 'admin' = 'user'): string => {
  if (!id || typeof id !== "number") {
    throw new Error("Invalid user ID for token generation");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const payload: JWTPayload = { 
    id: id,
    role: role 
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "30m", // 30 phút
  });
};

// Tạo refresh token với thời hạn 7 ngày (chỉ chứa id, không có role)
export const generateRefreshToken = (id: number): string => {
  if (!id || typeof id !== "number") {
    throw new Error("Invalid user ID for token generation");
  }

  // Fallback về JWT_SECRET nếu không có JWT_REFRESH_SECRET
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET or JWT_REFRESH_SECRET is not configured");
  }

  // Refresh token chỉ chứa id, không có role
  const payload: RefreshTokenPayload = { 
    id: id
  };
  
  return jwt.sign(payload, secret, {
    expiresIn: "7d", // 7 ngày
  });
};

// Giữ lại hàm cũ để tương thích ngược (nếu có code khác đang dùng)
export const generateToken = (id: number, role: 'user' | 'admin' = 'user'): string => {
  return generateAccessToken(id, role);
};
