import { PrismaService } from '../src/prisma/prisma.service';

export async function resetDb(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE "User" CASCADE;');
}