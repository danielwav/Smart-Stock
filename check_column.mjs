import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
const url = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port || '3306', 10),
  user: url.username,
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''),
  connectionLimit: 1,
});
const prisma = new PrismaClient({ adapter });
const rows = await prisma.$queryRawUnsafe("SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_NAME = 'User' AND COLUMN_NAME = 'avatarUrl'");
for (const row of rows) {
  console.log(row.COLUMN_NAME, row.DATA_TYPE, row.COLUMN_TYPE, String(row.CHARACTER_MAXIMUM_LENGTH));
}
await prisma.$disconnect();
