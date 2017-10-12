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

module.exports = exports = schema;
