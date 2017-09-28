"use strict";

const EventEmitter = require('events');
const fetch = require('node-fetch');

/**
 * A wrapper around node-fetch to make requests against the Neo4j GraphQL
 * extension.
 *
 * @param {string} url The endpoint to call.
 * @param {Object} [options] See the node-fetch documentation for a list of
 * options, and their defaults, to use in the request.
 * @return {Promise} A promise for the server's response. The JSON response is
 * passed to the caller's then function.
 * @throws {Error} An error is raised for any failures.
 */
function execute(url, options) {
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

class GraphQLDriver extends EventEmitter {
  /**
   * Parses out the base URL to the Neo4j server and generates the URL to the
   * GraphQL extension endpoint.
   *
   * @param {string} url The URL to the Neo4j server, as defined by the
   * GRAPHENEDB_URL environment variable.
   */
  constructor(url) {
    super();
    this._url = url.replace(/^(.*)\/db\/data$/g, '$1/graphql/');
    this._schema = null;
  }

  /**
   * Returns the URL to the Neo4j GraphQL extension endpoint.
   *
   * @return {string}
   */
  get url() {
    return this._url;
  }

  /**
   * Upload a schema to the database using the graphql/idl endpoint.
   *
   * The upload is retried until it is successful. A failure is usually due to
   * the Neo4j not being started yet.
   *
   * @fires schema:upload when making the request to upload the schema. The
   * schema being uploaded is passed as a parameter.
   * @fires schema:uploaded when the schema has been successfully uploaded. The
   * uploaded schema is passed as a parameter.
   * @fires schema:retry when there is a failure to upload the schema and a
   * retry is scheduled to be attempted in two seconds. The schema being
   * uploaded is passed as a parameter.
   * @param {string} schema The GraphQL schema for the database.
   */
  set schema(schema) {
    const self = this;

    this.emit('schema:upload', schema);

    execute(`${this.url}idl`, {body: schema}).then((json) => {
      self.emit('schema:uploaded', schema);
    })
    .catch((error) => {
      self.emit('schema:retry', schema);
      setTimeout(() => {
        self.schema = schema;
      }, 2000);
    });
  }

  /**
   * Useful for verifying that the schema looks correct.
   *
   * @example
   * driver.schema
   *   .then((schema) => console.log(JSON.stringify(schema, null, 2)))
   *   .catch((error) => console.log(error));
   *
   * @return {Promise} A promise for the schema from the database.
   * @throws {Error} An error is raised if the response does not include a
   * schema.
   */
  get schema() {
    if (this._schema) {
      return Promise.resolve(this._schema);
    }

    const self = this;

    return this.query("query {__schema {types {kind, name, description}}}")
      .then((json) => {
        if (json && json.data && json.data.__schema) {
          self._schema = json.data.__schema;
        } else {
          throw new Error('The response did not include a schema');
        }

        return self._schema;
      });
  }

  /**
   * Executes a GraphQL query on the database and returns the result.
   *
   * @param {string} query The GraphQL query to run.
   * @return {Promise} A promise for the response from the database.
   */
  query(query) {
    query = {
      query: query
    };

    const options = {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    };
    return execute(this.url, options);
  }
}

module.exports = exports = {
  graphql: function(url) {
    return new GraphQLDriver(url);
  }
};
