import { PrismaClient, Prisma } from '@prisma/client'; // Import Prisma namespace
import { env } from './env'; // Import the parsed environment variables

// Define logging levels based on NODE_ENV
const logLevels: Prisma.LogLevel[] = ['warn', 'error']; // Use Prisma.LogLevel
if (env.NODE_ENV === 'development') {
  logLevels.push('info', 'query');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL, // Use the DATABASE_URL from parsed env
    },
  },
  log: logLevels,
});

// Optional: Add connection pooling configuration if needed,
// though Prisma handles this reasonably well by default.
// For more explicit control, you might configure it in the DATABASE_URL
// e.g., ?connection_limit=10
// Or, if your Prisma version supports it directly in the client options:
// (This is a conceptual example, check Prisma docs for current best practice)
// clientExtensions: {
//   $pool: {
//     min: 2, // Minimum number of connections in the pool
//     max: env.NODE_ENV === 'development' ? 5 : 10, // Max connections
//     idleTimeoutMillis: 30000, // Close idle connections after 30s
//     acquireTimeoutMillis: 30000, // Timeout for acquiring a connection
//   }
// }

export default prisma;
