import 'dotenv/config';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { json } from 'body-parser';
import cors from 'cors';
import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
const typeDefs = loadSchemaSync('./src/api/schema.graphql', { loaders: [new GraphQLFileLoader()] });
import { resolvers } from './api/resolvers';
import { contextFactory } from './context';

const PORT = process.env.PORT || 4000;

async function startApolloServer() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    json(),
expressMiddleware(server, {      context: async ({ req }) => {        const userId = req.headers.authorization as string;        return contextFactory(userId || "anonymous");      },    }),  
  );

  app.get('/health', (_, res) => {
    res.status(200).send('OK');
  });

  await new Promise<void>((resolve) => app.listen({ port: PORT }, resolve));
  console.log(`Server ready at http://localhost:${PORT}/graphql`);
}

startApolloServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
// Cache bust
