// utils/generateToken.js
import jwt from "jsonwebtoken";

const generateToken = (res, userUid) => {
  const token = jwt.sign(
    { userId: userUid },           
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export default generateToken;
