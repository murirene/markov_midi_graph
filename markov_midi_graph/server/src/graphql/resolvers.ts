import { checkDatabase } from "../db/health.ts"

// Resolvers: functions that produce the data for each schema field.
export const resolvers = {
  Query: {
    health: async () => {
      const database = await checkDatabase()
      return { status: database.ok ? "ok" : "degraded", database }
    },
  },
}
