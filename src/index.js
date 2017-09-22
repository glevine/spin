"use strict";

const express = require('express');
const graphqlHTTP = require('express-graphql');
const {buildSchema} = require('graphql');

const schema = buildSchema(`
  type Query {
    hello: String
  }
`);

const root = {
  hello: () => {
    return 'Hello world!';
  },
};

const app = express();

app.use(graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: app.get('env') === 'development',
}));

const server = app.listen(80, () => {
  const address = server.address();
  console.log(`Running a GraphQL API server at ${address.address}:${address.port} in ${app.get('env')}`);
});
