import { Prisma } from "prisma-binding";
import { fragmentReplacements } from "./resolvers/index";
import dotenv from "dotenv";
dotenv.config({ path: "config/prod.env" });

const prisma = new Prisma({
  typeDefs: "./src/generated/prisma.graphql",
  endpoint:
    "https://shahmir-faisal-blog-a3b034697a.herokuapp.com/shahmir-faisal-blog/prod",
  secret: "programmingchola",
  fragmentReplacements,
});

export default prisma;
