import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  const url = new URL(process.env.DATABASE_URL!);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: parseInt(url.port || '3306', 10),
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    connectionLimit: 10,
  });
  prisma = new PrismaClient({ adapter });
} else {
  // Prevent multiple instances of Prisma Client in development
  if (!(global as any).globalPrisma) {
    const url = new URL(process.env.DATABASE_URL!);
    const adapter = new PrismaMariaDb({
      host: url.hostname,
      port: parseInt(url.port || '3306', 10),
      user: url.username,
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      connectionLimit: 5,
    });
    (global as any).globalPrisma = new PrismaClient({ adapter });
  }
  prisma = (global as any).globalPrisma;
}

export { prisma };
