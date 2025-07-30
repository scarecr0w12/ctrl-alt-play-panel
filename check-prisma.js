const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('PrismaClient methods:');
for (const key in prisma) {
  if (key.startsWith('$')) {
    console.log(key);
  }
}

prisma.$disconnect();
