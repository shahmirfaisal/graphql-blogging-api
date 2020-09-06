import jwt from "jsonwebtoken";

const getUserId = ({ request }, requireAuth = true) => {
  const header = request.headers.authorization;
  if (!header && requireAuth) throw new Error("Authentication required!");
  const token = header.replace("Bearer ", "");
  const { userId } = jwt.verify(token, "programmingchola");
  return userId;
};

export default getUserId;
