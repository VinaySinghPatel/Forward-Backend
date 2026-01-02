import { verifyToken } from "./jwt.js";

export const socketAuth = (token: string) => {
  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    return null;
  }
};
