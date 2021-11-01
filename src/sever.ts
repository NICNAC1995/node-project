import express from "express";
import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";

import { BookResolver } from "./resolvers/book.resolver";
import { AuthorResolver } from "./resolvers/author.resolver";
import { AuthResolver } from "./resolvers/auth.resolver";

export async function startServer() {
  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [BookResolver, AuthorResolver, AuthResolver],
    }),
    context: ({ req, res }) => ({ req, res }),
  });

  await apolloServer.start();
  // esto (linea anterior) lo tuve que agregar (buscando en internet: https://stackoverflow.com/questions/68614523/error-you-must-await-server-start-before-calling-server-applymiddleware) en internete porque si no no funcionaba

  apolloServer.applyMiddleware({ app, path: "/graphql" });

  return app;
}
