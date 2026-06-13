import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

function createPrismaClient(): PrismaClient {
  const url = new URL(process.env.DATABASE_URL!);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: parseInt(url.port || '3306', 10),
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    connectionLimit: process.env.NODE_ENV === 'production' ? 10 : 5,
  });
  return new PrismaClient({ adapter });
}

let prismaClient: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = createPrismaClient();
  }
  return prismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return getClient()[prop as keyof PrismaClient];
  },
  set(_, prop, value) {
    (getClient() as any)[prop] = value;
    return true;
  },
});
