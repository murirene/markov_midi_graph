// The GraphQL schema (SDL). Each field on `Query` needs a matching resolver
// in resolvers.ts.
export const typeDefs = `#graphql
  type DatabaseHealth {
    ok: Boolean!
    database: String
    role: String
    serverTime: String
    error: String
  }

  type Health {
    status: String!
    database: DatabaseHealth!
  }

  type Query {
    health: Health!
  }
`
