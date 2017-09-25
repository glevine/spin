"use strict";

const express = require('express');
const graphqlHTTP = require('express-graphql');
const {buildSchema} = require('graphql');
const fetch = require('node-fetch');

const neo4jUrl = process.env.GRAPHENEDB_URL;

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

function executeQuery(endpoint, options) {
  const url = neo4jUrl + endpoint;

  options = Object.assign({method: 'POST'}, options);

  return fetch(url, options)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }

      throw new Error(`Request failed: ${url}`);
    })
    .catch((error) => {
      console.log(error);
      throw error;
    });
}

function uploadSchema(schema) {
  console.log('Uploading the schema...');
  executeQuery('graphql/idl', {body: schema}).then((json) => {
    console.log('Schema has been uploaded!');
  })
  .catch((error) => {
    console.log('Retry upload schema...');
    setTimeout(() => uploadSchema(schema), 2000);
  });
}

uploadSchema(schema);

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
  const address = server.address();
  console.log(`Running a GraphQL API server at ${address.address}:${address.port} in ${app.get('env')}`);
});
