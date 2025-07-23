import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.serverMetrics.deleteMany({});
  await prisma.allocation.deleteMany({});
  await prisma.server.deleteMany({});
  await prisma.egg.deleteMany({});
  await prisma.nest.deleteMany({});
  await prisma.node.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.location.deleteMany({});

  console.log('📍 Creating location...');
  // Create default location
  const location = await prisma.location.create({
    data: {
      id: 'loc_default',
      name: 'Default Location',
      description: 'Default server location'
    }
  });

    // Create default node
  const node = await prisma.node.create({
    data: {
      id: 'node_default',
      name: 'Default Node',
      description: 'Default application node',
      locationId: location.id,
      fqdn: 'localhost',
      scheme: 'http',
      port: 8080,
      publicPort: 8080,
      isBehindProxy: false,
      memory: 8192,
      disk: 50000,
      isMaintenanceMode: false,
      uploadSize: 100,
      daemonToken: 'demo-secret-token'
    }
  });

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: adminPasswordHash,
      role: 'ADMIN',
      rootAdmin: true,
      isActive: true
    }
  });

  // Create regular user
  const userPasswordHash = await bcrypt.hash('user123', 12);
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      username: 'user',
      firstName: 'Regular',
      lastName: 'User',
      password: userPasswordHash,
      role: 'USER',
      isActive: true
    }
  });

  // Create sample allocations
  const allocation1 = await prisma.allocation.create({
    data: {
      ip: '127.0.0.1',
      port: 25565,
      nodeId: node.id
    }
  });

  const allocation2 = await prisma.allocation.create({
    data: {
      ip: '127.0.0.1',
      port: 28015,
      nodeId: node.id
    }
  });

  // Create sample nest first
  const gameNest = await prisma.nest.create({
    data: {
      name: 'Game Servers',
      description: 'Various game server configurations'
    }
  });

  // Create sample egg (server type)
  const minecraftEgg = await prisma.egg.create({
    data: {
      name: 'Minecraft Java',
      description: 'Minecraft Java Edition server',
      author: 'System',
      startup: 'java -Xms{{SERVER_MEMORY}}M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}',
      dockerImages: JSON.stringify({
        'itzg/minecraft-server': 'latest'
      }),
      configFiles: JSON.stringify({
        'server.properties': {
          parser: 'properties',
          find: {
            'server-port': '{{SERVER_PORT}}',
            'max-players': '{{MAX_PLAYERS}}',
            'motd': '{{SERVER_MOTD}}'
          }
        }
      }),
      configStartup: JSON.stringify({
        done: 'Done (',
        userInteraction: []
      }),
      configStop: 'stop',
      configLogs: JSON.stringify({
        custom: true,
        location: 'logs/latest.log'
      }),
      nestId: gameNest.id
    }
  });

  // Create sample servers
  const server1 = await prisma.server.create({
    data: {
      name: 'Minecraft Survival',
      description: 'A survival Minecraft server',
      userId: regularUser.id,
      nodeId: node.id,
      eggId: minecraftEgg.id,
      memory: 2048,
      disk: 5000,
      io: 500,
      cpu: 100,
      swap: 0,
      image: 'itzg/minecraft-server:latest',
      startup: 'java -Xms2048M -Xmx2048M -jar server.jar',
      status: 'OFFLINE',
      environment: JSON.stringify({
        SERVER_JARFILE: 'server.jar',
        SERVER_MEMORY: '2048',
        MAX_PLAYERS: '20',
        SERVER_MOTD: 'A Minecraft Server'
      })
    }
  });

  // Assign allocation to server
  await prisma.allocation.update({
    where: { id: allocation1.id },
    data: { serverId: server1.id }
  });

  const server2 = await prisma.server.create({
    data: {
      name: 'Rust Experimental',
      description: 'Rust experimental server',
      userId: adminUser.id,
      nodeId: node.id,
      eggId: minecraftEgg.id, // We'll use minecraft egg for now
      memory: 4096,
      disk: 10000,
      io: 500,
      cpu: 200,
      swap: 1024,
      image: 'itzg/minecraft-server:latest',
      startup: 'java -Xms4096M -Xmx4096M -jar server.jar',
      status: 'RUNNING',
      environment: JSON.stringify({
        SERVER_JARFILE: 'server.jar',
        SERVER_MEMORY: '4096',
        MAX_PLAYERS: '100',
        SERVER_MOTD: 'Rust Experimental Server'
      })
    }
  });

  await prisma.allocation.update({
    where: { id: allocation2.id },
    data: { serverId: server2.id }
  });

  // Create sample metrics
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)); // Last 24 hours
    
    await prisma.serverMetrics.create({
      data: {
        serverId: server1.id,
        nodeId: node.id,
        cpu: Math.random() * 50 + 10, // 10-60% CPU
        memory: Math.random() * 1500 + 500, // 500-2000MB memory
        disk: Math.random() * 1000 + 2000, // 2000-3000MB disk
        networkIn: Math.random() * 1000000, // Random network
        networkOut: Math.random() * 1000000, // Random network
        players: Math.floor(Math.random() * 15), // 0-15 players
        timestamp
      }
    });

    await prisma.serverMetrics.create({
      data: {
        serverId: server2.id,
        nodeId: node.id,
        cpu: Math.random() * 80 + 20, // 20-100% CPU
        memory: Math.random() * 3000 + 1000, // 1000-4000MB memory  
        disk: Math.random() * 2000 + 5000, // 5000-7000MB disk
        networkIn: Math.random() * 2000000,
        networkOut: Math.random() * 2000000,
        players: Math.floor(Math.random() * 100), // 0-100 players
        timestamp
      }
    });
  }

  console.log('✅ Database seeding completed!');
  console.log(`👤 Admin user: admin@example.com / admin123`);
  console.log(`👤 Regular user: user@example.com / user123`);
  console.log(`🖥️  Created ${await prisma.server.count()} servers`);
  console.log(`📊 Created ${await prisma.serverMetrics.count()} metric entries`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
