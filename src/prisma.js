import { Prisma } from "prisma-binding";
import { fragmentReplacements } from "./resolvers/index";
import dotenv from "dotenv";
dotenv.config({ path: "config/prod.env" });

const prisma = new Prisma({
  typeDefs: "./src/generated/prisma.graphql",
  endpoint: process.env.PRISMA_ENDPOINT,
  secret: process.env.SECRET,
  fragmentReplacements,
});

export default prisma;
