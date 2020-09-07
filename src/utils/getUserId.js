import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({ path: "config/prod.env" });

const getUserId = ({ request }, requireAuth = true) => {
  const header = request.headers.authorization;
  if (!header && requireAuth) throw new Error("Authentication required!");
  const token = header.replace("Bearer ", "");
  const { userId } = jwt.verify(token, process.env.SECRET);
  return userId;
};

export default getUserId;
