"use strict";

const express = require('express');
const graphqlHTTP = require('express-graphql');
const {buildSchema} = require('graphql');
const db = require('./db').graphql(process.env.GRAPHENEDB_URL);

const schema = `
  type Resource {
    location: ID!
    linked_by: [Resource] @relation(name: "LINKED_TO", direction: "in")
    linked_to: [Resource] @relation(name: "LINKED_TO", direction: "out")
    topics: [Topic] @relation(name: "TAGGED_WITH")
  }

  type Topic {
    name: ID!
    resources: [Resource] @relation(name: "TAGGED_WITH")
  }

  type Query {
    resource(location:ID!): Resource
    topic(name:ID!): Topic
  }

  schema {
    query: Query
  }
`;

db.on('schema:uploaded', () => console.log('Schema has been uploaded!'));
db.schema = schema;

const app = express();

app.use(graphqlHTTP({
  schema: buildSchema(`
    type Query {
      hello: String
    }
  `),
  rootValue: {
    hello: () => {
      return 'Hello world!';
    },
  },
  graphiql: app.get('env') === 'development',
}));

const server = app.listen(80, () => {
  const port = server.address().port;
  require('dns').lookup(require('os').hostname(), (err, address, fam) => {
    console.log(
      'Running a GraphQL API server in %s at %s:%s',
      app.get('env'),
      address,
      port
    );
  });
});
