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
  await prisma.alt.deleteMany({});
  await prisma.ctrl.deleteMany({});
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

    // Create a Ctrl (container template)
  console.log('🎮 Creating Ctrl...');
  const gameCtrl = await prisma.ctrl.create({
    data: {
      name: 'Game Servers',
      description: 'Container for game server types',
    }
  });

  // Create an Alt (server template)
  console.log('🥚 Creating Alt...');
  const minecraftAlt = await prisma.alt.create({
    data: {
      ctrlId: gameCtrl.id,
      name: 'Minecraft Java Edition',
      description: 'Minecraft Java Edition Server',
      author: 'System',
      dockerImages: JSON.stringify(['itzg/minecraft-server:latest']),
      startup: 'java -Xmx{{SERVER_MEMORY}}M -Xms{{SERVER_MEMORY}}M -jar server.jar',
      configFiles: JSON.stringify({
        'server.properties': 'server-port={{SERVER_PORT}}\\nmotd={{SERVER_NAME}}\\nmax-players={{MAX_PLAYERS}}'
      }),
      configStartup: JSON.stringify({}),
      configLogs: JSON.stringify({
        'server.log': '/logs/latest.log'
      }),
      configStop: 'stop',
      scriptContainer: 'openjdk:11',
      scriptEntry: 'ash',
      scriptInstall: 'echo "Installing Minecraft server..."\\nwget -O server.jar https://papermc.io/api/v2/projects/paper/versions/1.19.4/builds/489/downloads/paper-1.19.4-489.jar',
      copyScriptFrom: null,
    }
  });

  // Create sample servers
  const server1 = await prisma.server.create({
    data: {
      name: 'Test Server 1',
      description: 'A test Minecraft server for development',
      memory: 1024,
      disk: 2048,
      cpu: 100,
      swap: 512,
      io: 500,
      image: 'itzg/minecraft-server:latest',
      startup: 'java -Xmx1024M -Xms1024M -jar server.jar',
      userId: regularUser.id,
      nodeId: node.id,
      altId: minecraftAlt.id,
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
      name: 'Development Server',
      description: 'Another test server for development purposes',
      memory: 2048,
      disk: 4096,
      cpu: 200,
      swap: 1024,
      io: 500,
      image: 'itzg/minecraft-server:latest',
      startup: 'java -Xmx2048M -Xms2048M -jar server.jar',
      userId: adminUser.id,
      nodeId: node.id,
      altId: minecraftAlt.id, // We'll use minecraft alt for now
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
