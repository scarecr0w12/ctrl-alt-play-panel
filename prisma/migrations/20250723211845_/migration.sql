-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MODERATOR', 'USER');

-- CreateEnum
CREATE TYPE "ServerStatus" AS ENUM ('INSTALLING', 'INSTALL_FAILED', 'SUSPENDED', 'OFFLINE', 'STARTING', 'RUNNING', 'STOPPING', 'CRASHED');

-- CreateEnum
CREATE TYPE "TaskAction" AS ENUM ('COMMAND', 'POWER', 'BACKUP');

-- CreateEnum
CREATE TYPE "ScheduleState" AS ENUM ('INACTIVE', 'ACTIVE', 'PROCESSING');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InstallationStatus" AS ENUM ('PENDING', 'DOWNLOADING', 'INSTALLING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "VoiceServerType" AS ENUM ('TEAMSPEAK', 'DISCORD', 'MUMBLE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "language" TEXT NOT NULL DEFAULT 'en',
    "externalId" TEXT,
    "rootAdmin" BOOLEAN NOT NULL DEFAULT false,
    "useTotp" BOOLEAN NOT NULL DEFAULT false,
    "totpSecret" TEXT,
    "gravatar" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fqdn" TEXT NOT NULL,
    "scheme" TEXT NOT NULL DEFAULT 'https',
    "port" INTEGER NOT NULL DEFAULT 8080,
    "publicPort" INTEGER NOT NULL,
    "memory" INTEGER NOT NULL,
    "memoryOverallocate" INTEGER,
    "disk" INTEGER NOT NULL,
    "diskOverallocate" INTEGER,
    "uploadSize" INTEGER NOT NULL DEFAULT 100,
    "locationId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isBehindProxy" BOOLEAN NOT NULL DEFAULT false,
    "isMaintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "daemonToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servers" (
    "id" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "uuidShort" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ServerStatus" NOT NULL DEFAULT 'INSTALLING',
    "skipScripts" BOOLEAN NOT NULL DEFAULT false,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "memory" INTEGER NOT NULL,
    "disk" INTEGER NOT NULL,
    "cpu" INTEGER NOT NULL,
    "swap" INTEGER NOT NULL,
    "io" INTEGER NOT NULL,
    "threads" TEXT,
    "oomKiller" BOOLEAN NOT NULL DEFAULT true,
    "image" TEXT NOT NULL,
    "startup" TEXT NOT NULL,
    "environment" JSONB NOT NULL DEFAULT '{}',
    "installedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "databaseLimit" INTEGER NOT NULL DEFAULT 0,
    "allocationLimit" INTEGER NOT NULL DEFAULT 0,
    "backupLimit" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "eggId" TEXT NOT NULL,

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "alias" TEXT,
    "notes" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nodeId" TEXT NOT NULL,
    "serverId" TEXT,

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eggs" (
    "id" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "author" TEXT NOT NULL,
    "dockerImages" JSONB NOT NULL DEFAULT '{}',
    "startup" TEXT NOT NULL,
    "configFiles" JSONB NOT NULL DEFAULT '{}',
    "configStartup" JSONB NOT NULL DEFAULT '{}',
    "configLogs" JSONB NOT NULL DEFAULT '{}',
    "configStop" TEXT,
    "scriptInstall" TEXT,
    "scriptEntry" TEXT NOT NULL DEFAULT 'bash',
    "scriptContainer" TEXT NOT NULL DEFAULT 'alpine:3.4',
    "copyScriptFrom" TEXT,
    "features" JSONB DEFAULT '[]',
    "fileDenylist" JSONB DEFAULT '[]',
    "forceOutgoingIp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nestId" TEXT NOT NULL,

    CONSTRAINT "eggs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "egg_variables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "envVariable" TEXT NOT NULL,
    "defaultValue" TEXT NOT NULL,
    "userViewable" BOOLEAN NOT NULL DEFAULT true,
    "userEditable" BOOLEAN NOT NULL DEFAULT true,
    "rules" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eggId" TEXT NOT NULL,

    CONSTRAINT "egg_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "databases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "remote" TEXT NOT NULL DEFAULT '%',
    "maxConnections" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serverId" TEXT NOT NULL,
    "databaseHostId" TEXT NOT NULL,

    CONSTRAINT "databases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "database_hosts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 3306,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "maxConnections" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nodeId" TEXT,

    CONSTRAINT "database_hosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backups" (
    "id" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ignoredFiles" JSONB NOT NULL DEFAULT '[]',
    "size" BIGINT NOT NULL DEFAULT 0,
    "checksum" TEXT,
    "uploadId" TEXT,
    "isSuccessful" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "allowedIps" JSONB NOT NULL DEFAULT '[]',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "memo" TEXT,
    "userRead" BOOLEAN NOT NULL DEFAULT false,
    "userCreate" BOOLEAN NOT NULL DEFAULT false,
    "userUpdate" BOOLEAN NOT NULL DEFAULT false,
    "userDelete" BOOLEAN NOT NULL DEFAULT false,
    "nodeRead" BOOLEAN NOT NULL DEFAULT false,
    "nodeCreate" BOOLEAN NOT NULL DEFAULT false,
    "nodeUpdate" BOOLEAN NOT NULL DEFAULT false,
    "nodeDelete" BOOLEAN NOT NULL DEFAULT false,
    "serverRead" BOOLEAN NOT NULL DEFAULT false,
    "serverCreate" BOOLEAN NOT NULL DEFAULT false,
    "serverUpdate" BOOLEAN NOT NULL DEFAULT false,
    "serverDelete" BOOLEAN NOT NULL DEFAULT false,
    "locationRead" BOOLEAN NOT NULL DEFAULT false,
    "locationCreate" BOOLEAN NOT NULL DEFAULT false,
    "locationUpdate" BOOLEAN NOT NULL DEFAULT false,
    "locationDelete" BOOLEAN NOT NULL DEFAULT false,
    "nestRead" BOOLEAN NOT NULL DEFAULT false,
    "nestCreate" BOOLEAN NOT NULL DEFAULT false,
    "nestUpdate" BOOLEAN NOT NULL DEFAULT false,
    "nestDelete" BOOLEAN NOT NULL DEFAULT false,
    "eggRead" BOOLEAN NOT NULL DEFAULT false,
    "eggCreate" BOOLEAN NOT NULL DEFAULT false,
    "eggUpdate" BOOLEAN NOT NULL DEFAULT false,
    "eggDelete" BOOLEAN NOT NULL DEFAULT false,
    "databaseRead" BOOLEAN NOT NULL DEFAULT false,
    "databaseCreate" BOOLEAN NOT NULL DEFAULT false,
    "databaseUpdate" BOOLEAN NOT NULL DEFAULT false,
    "databaseDelete" BOOLEAN NOT NULL DEFAULT false,
    "scheduleRead" BOOLEAN NOT NULL DEFAULT false,
    "scheduleCreate" BOOLEAN NOT NULL DEFAULT false,
    "scheduleUpdate" BOOLEAN NOT NULL DEFAULT false,
    "scheduleDelete" BOOLEAN NOT NULL DEFAULT false,
    "userManagement" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "serverId" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subusers" (
    "id" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,

    CONSTRAINT "subusers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cronMinute" TEXT NOT NULL,
    "cronHour" TEXT NOT NULL,
    "cronDayOfMonth" TEXT NOT NULL,
    "cronMonth" TEXT NOT NULL,
    "cronDayOfWeek" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isProcessing" BOOLEAN NOT NULL DEFAULT false,
    "onlyWhenOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "sequenceId" INTEGER NOT NULL,
    "action" "TaskAction" NOT NULL,
    "payload" TEXT NOT NULL,
    "timeOffset" INTEGER NOT NULL DEFAULT 0,
    "continueOnFailure" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scheduleId" TEXT NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_variables" (
    "id" TEXT NOT NULL,
    "variableValue" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "eggVariableId" TEXT NOT NULL,

    CONSTRAINT "server_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_transfers" (
    "id" TEXT NOT NULL,
    "oldNode" INTEGER NOT NULL,
    "newNode" INTEGER NOT NULL,
    "oldAllocation" INTEGER NOT NULL,
    "newAllocation" INTEGER NOT NULL,
    "oldAdditionalAllocations" JSONB NOT NULL DEFAULT '[]',
    "newAdditionalAllocations" JSONB NOT NULL DEFAULT '[]',
    "successful" BOOLEAN,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serverId" TEXT NOT NULL,

    CONSTRAINT "server_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_ssh_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "user_ssh_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "recovery_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "batch" TEXT,
    "event" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "description" TEXT,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "subjectId" TEXT,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_metrics" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "cpu" DOUBLE PRECISION NOT NULL,
    "memory" DOUBLE PRECISION NOT NULL,
    "disk" DOUBLE PRECISION NOT NULL,
    "networkIn" DOUBLE PRECISION NOT NULL,
    "networkOut" DOUBLE PRECISION NOT NULL,
    "players" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "serverId" TEXT,
    "nodeId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'LOW',
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "steam_workshop_items" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "fileSize" INTEGER,
    "downloadUrl" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "steam_workshop_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_installations" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "status" "InstallationStatus" NOT NULL DEFAULT 'PENDING',
    "installedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mod_packs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "gameType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "configFiles" JSONB,
    "commandLine" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mod_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mod_installations" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "modPackId" TEXT NOT NULL,
    "status" "InstallationStatus" NOT NULL DEFAULT 'PENDING',
    "installedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mod_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_servers" (
    "id" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "VoiceServerType" NOT NULL,
    "nodeId" TEXT NOT NULL,
    "serverId" TEXT,
    "port" INTEGER NOT NULL,
    "slots" INTEGER NOT NULL,
    "password" TEXT,
    "adminToken" TEXT,
    "status" "ServerStatus" NOT NULL DEFAULT 'OFFLINE',
    "autoStart" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_servers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_externalId_key" ON "users"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "nodes_uuid_key" ON "nodes"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "nodes_fqdn_key" ON "nodes"("fqdn");

-- CreateIndex
CREATE UNIQUE INDEX "nodes_daemonToken_key" ON "nodes"("daemonToken");

-- CreateIndex
CREATE UNIQUE INDEX "servers_uuid_key" ON "servers"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "servers_uuidShort_key" ON "servers"("uuidShort");

-- CreateIndex
CREATE UNIQUE INDEX "servers_externalId_key" ON "servers"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "allocations_ip_port_nodeId_key" ON "allocations"("ip", "port", "nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "nests_name_key" ON "nests"("name");

-- CreateIndex
CREATE UNIQUE INDEX "eggs_uuid_key" ON "eggs"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "databases_serverId_name_key" ON "databases"("serverId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "backups_uuid_key" ON "backups"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_identifier_key" ON "api_keys"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "subusers_userId_serverId_key" ON "subusers"("userId", "serverId");

-- CreateIndex
CREATE UNIQUE INDEX "server_variables_serverId_eggVariableId_key" ON "server_variables"("serverId", "eggVariableId");

-- CreateIndex
CREATE UNIQUE INDEX "user_ssh_keys_fingerprint_key" ON "user_ssh_keys"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "recovery_tokens_token_key" ON "recovery_tokens"("token");

-- CreateIndex
CREATE INDEX "server_metrics_serverId_timestamp_idx" ON "server_metrics"("serverId", "timestamp");

-- CreateIndex
CREATE INDEX "server_metrics_nodeId_timestamp_idx" ON "server_metrics"("nodeId", "timestamp");

-- CreateIndex
CREATE INDEX "alerts_serverId_idx" ON "alerts"("serverId");

-- CreateIndex
CREATE INDEX "alerts_nodeId_idx" ON "alerts"("nodeId");

-- CreateIndex
CREATE INDEX "alerts_severity_acknowledged_idx" ON "alerts"("severity", "acknowledged");

-- CreateIndex
CREATE UNIQUE INDEX "steam_workshop_items_workshopId_key" ON "steam_workshop_items"("workshopId");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_installations_serverId_itemId_key" ON "workshop_installations"("serverId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "mod_installations_serverId_modPackId_key" ON "mod_installations"("serverId", "modPackId");

-- CreateIndex
CREATE UNIQUE INDEX "voice_servers_uuid_key" ON "voice_servers"("uuid");

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servers" ADD CONSTRAINT "servers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servers" ADD CONSTRAINT "servers_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servers" ADD CONSTRAINT "servers_eggId_fkey" FOREIGN KEY ("eggId") REFERENCES "eggs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eggs" ADD CONSTRAINT "eggs_nestId_fkey" FOREIGN KEY ("nestId") REFERENCES "nests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egg_variables" ADD CONSTRAINT "egg_variables_eggId_fkey" FOREIGN KEY ("eggId") REFERENCES "eggs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "databases" ADD CONSTRAINT "databases_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "databases" ADD CONSTRAINT "databases_databaseHostId_fkey" FOREIGN KEY ("databaseHostId") REFERENCES "database_hosts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "database_hosts" ADD CONSTRAINT "database_hosts_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backups" ADD CONSTRAINT "backups_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backups" ADD CONSTRAINT "backups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subusers" ADD CONSTRAINT "subusers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subusers" ADD CONSTRAINT "subusers_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_variables" ADD CONSTRAINT "server_variables_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_variables" ADD CONSTRAINT "server_variables_eggVariableId_fkey" FOREIGN KEY ("eggVariableId") REFERENCES "egg_variables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_transfers" ADD CONSTRAINT "server_transfers_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ssh_keys" ADD CONSTRAINT "user_ssh_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_tokens" ADD CONSTRAINT "recovery_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_metrics" ADD CONSTRAINT "server_metrics_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_metrics" ADD CONSTRAINT "server_metrics_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_installations" ADD CONSTRAINT "workshop_installations_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_installations" ADD CONSTRAINT "workshop_installations_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "steam_workshop_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mod_installations" ADD CONSTRAINT "mod_installations_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mod_installations" ADD CONSTRAINT "mod_installations_modPackId_fkey" FOREIGN KEY ("modPackId") REFERENCES "mod_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_servers" ADD CONSTRAINT "voice_servers_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_servers" ADD CONSTRAINT "voice_servers_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
