import { PrismaClient } from '@prisma/client';

async function checkPlugins() {
  const prisma = new PrismaClient();
  
  try {
    const plugins = await prisma.plugin.findMany();
    console.log('Plugins in database:', plugins);
  } catch (error) {
    console.error('Error querying plugins:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlugins();
