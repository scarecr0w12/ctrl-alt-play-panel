-- CreateEnum
CREATE TYPE "public"."PluginStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR', 'UPDATING');

-- CreateTable
CREATE TABLE "public"."plugins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "autoUpdate" BOOLEAN NOT NULL DEFAULT false,
    "versionLocked" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."PluginStatus" NOT NULL DEFAULT 'INACTIVE',
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plugins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."plugin_data" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plugin_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."plugin_marketplace" (
    "id" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "pluginName" TEXT NOT NULL,
    "remoteVersion" TEXT,
    "downloadUrl" TEXT,
    "checksum" TEXT,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plugin_marketplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."game_templates" (
    "id" TEXT NOT NULL,
    "plugin_name" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "game_type" TEXT NOT NULL,
    "docker_image" TEXT NOT NULL,
    "startup_cmd" TEXT NOT NULL,
    "config_files" JSONB NOT NULL DEFAULT '{}',
    "variables" JSONB NOT NULL DEFAULT '{}',
    "ports" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."docker_configs" (
    "id" TEXT NOT NULL,
    "plugin_name" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT NOT NULL,
    "environment" JSONB NOT NULL DEFAULT '{}',
    "volumes" JSONB NOT NULL DEFAULT '[]',
    "ports" JSONB NOT NULL DEFAULT '[]',
    "networks" JSONB NOT NULL DEFAULT '[]',
    "labels" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "docker_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billing_integrations" (
    "id" TEXT NOT NULL,
    "plugin_name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "webhook_url" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plugins_name_key" ON "public"."plugins"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plugin_data_pluginId_key_key" ON "public"."plugin_data"("pluginId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "plugin_marketplace_pluginId_key" ON "public"."plugin_marketplace"("pluginId");

-- CreateIndex
CREATE UNIQUE INDEX "game_templates_plugin_name_name_key" ON "public"."game_templates"("plugin_name", "name");

-- CreateIndex
CREATE UNIQUE INDEX "docker_configs_plugin_name_name_key" ON "public"."docker_configs"("plugin_name", "name");

-- CreateIndex
CREATE UNIQUE INDEX "billing_integrations_plugin_name_key" ON "public"."billing_integrations"("plugin_name");

-- AddForeignKey
ALTER TABLE "public"."plugin_data" ADD CONSTRAINT "plugin_data_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "public"."plugins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."plugin_marketplace" ADD CONSTRAINT "plugin_marketplace_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "public"."plugins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
