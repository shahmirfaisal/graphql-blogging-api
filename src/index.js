import "@babel/polyfill";
import { GraphQLServer, PubSub } from "graphql-yoga";
import db from "./db";
import { resolvers, fragmentReplacements } from "./resolvers/index";
import prisma from "./prisma";

const pubsub = new PubSub();

const server = new GraphQLServer({
  typeDefs: "./src/schema.graphql",
  resolvers,
  context(request) {
    return {
      db,
      pubsub,
      prisma,
      request,
    };
  },
  fragmentReplacements,
});
server
  .start({
    port: process.env.PORT || 4000,
    bodyParserOptions: { limit: "20mb", type: "application/json" },
  })
  .then(() => console.log("Server started!"));
