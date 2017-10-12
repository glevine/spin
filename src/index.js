"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const {buildSchema} = require('graphql');
const httpError = require('http-errors');
const neo = require('./neo4j').graphql(process.env.GRAPHENEDB_URL);
const schema = require('./schema');

/**
 * Is the application in development?
 *
 * @return {boolean}
 */
function inDev(app) {
  return app.get('env') === 'development';
}

/**
 * Does this request prefer HTML over JSON?
 *
 * @return {boolean}
 */
function isHtmlPreferred(request) {
  return require('accepts')(request).types(['json', 'html']) === 'html';
}

let uploadingSchema = true;
neo.on('schema:uploaded', () => {
  uploadingSchema = false;
  console.log('Schema has been uploaded!');
});
neo.schema = schema;

const app = express();
app.use(bodyParser.json());

// GraphQL HTTP only supports GET and POST methods.
app.use((request, response, next) => {
  let error;

  if (!['GET', 'POST'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST');
    error = httpError(405, 'GraphQL only supports GET and POST requests.');
  }

  next(error);
});

// Let the user know that the API isn't ready yet.
app.use((request, response, next) => {
  let error;

  if (uploadingSchema) {
    error = httpError(503, 'Initializing GraphQL API.');
  }

  next(error);
});

if (inDev(app)) {
  // Show GraphiQL if this request prefers HTML over JSON.
  app.use((request, response, next) => {
    if (isHtmlPreferred(request)) {
      response.sendFile(require('path').join(`${__dirname}/graphiql.html`));
    } else {
      next();
    }
  });
}

// Make JSON GraphQL queries.
app.use((request, response, next) => {
  const query = request.body && request.body.query ? request.body.query : null;

  neo.query(query)
    .then(json => {
      response.json(json);
      next();
    })
    .catch(error => next(httpError(error)));
});

// Handle errors.
app.use((error, request, response, next) => {
  if (response.headersSent) {
    return next(err);
  }

  let data = {
    message: error.message
  };

  if (inDev(app)) {
    data.error = error;
  }

  response.status(error.status || 500);
  response.json(data);
});

// Start the server.
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
