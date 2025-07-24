/*
  Warnings:

  - You are about to drop the column `eggVariableId` on the `server_variables` table. All the data in the column will be lost.
  - You are about to drop the column `eggId` on the `servers` table. All the data in the column will be lost.
  - You are about to drop the `egg_variables` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `eggs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `nests` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[serverId,altVariableId]` on the table `server_variables` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `altVariableId` to the `server_variables` table without a default value. This is not possible if the table is not empty.
  - Added the required column `altId` to the `servers` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Create new tables
CREATE TABLE "ctrls" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ctrls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "alts" (
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
    "ctrlId" TEXT NOT NULL,

    CONSTRAINT "alts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "alt_variables" (
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
    "altId" TEXT NOT NULL,

    CONSTRAINT "alt_variables_pkey" PRIMARY KEY ("id")
);

-- Step 2: Migrate data from nests to ctrls
INSERT INTO "ctrls" (id, name, description, "createdAt", "updatedAt")
SELECT id, name, description, "createdAt", "updatedAt" FROM "nests";

-- Step 3: Migrate data from eggs to alts
INSERT INTO "alts" (id, uuid, name, description, author, "dockerImages", startup, "configFiles", "configStartup", "configLogs", "configStop", "scriptInstall", "scriptEntry", "scriptContainer", "copyScriptFrom", features, "fileDenylist", "forceOutgoingIp", "createdAt", "updatedAt", "ctrlId")
SELECT id, uuid, name, description, author, "dockerImages", startup, "configFiles", "configStartup", "configLogs", "configStop", "scriptInstall", "scriptEntry", "scriptContainer", "copyScriptFrom", features, "fileDenylist", "forceOutgoingIp", "createdAt", "updatedAt", "nestId" FROM "eggs";

-- Step 4: Migrate data from egg_variables to alt_variables  
INSERT INTO "alt_variables" (id, name, description, "envVariable", "defaultValue", "userViewable", "userEditable", rules, "createdAt", "updatedAt", "altId")
SELECT id, name, description, "envVariable", "defaultValue", "userViewable", "userEditable", rules, "createdAt", "updatedAt", "eggId" FROM "egg_variables";

-- Step 5: Add altId column to servers table and populate it
ALTER TABLE "servers" ADD COLUMN "altId" TEXT;
UPDATE "servers" SET "altId" = "eggId";
ALTER TABLE "servers" ALTER COLUMN "altId" SET NOT NULL;

-- Step 6: Add altVariableId column to server_variables table and populate it
ALTER TABLE "server_variables" ADD COLUMN "altVariableId" TEXT;
UPDATE "server_variables" SET "altVariableId" = "eggVariableId";
ALTER TABLE "server_variables" ALTER COLUMN "altVariableId" SET NOT NULL;

-- Step 7: Create indexes
CREATE UNIQUE INDEX "ctrls_name_key" ON "ctrls"("name");
CREATE UNIQUE INDEX "alts_uuid_key" ON "alts"("uuid");

-- Step 8: Add foreign keys
ALTER TABLE "alts" ADD CONSTRAINT "alts_ctrlId_fkey" FOREIGN KEY ("ctrlId") REFERENCES "ctrls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "alt_variables" ADD CONSTRAINT "alt_variables_altId_fkey" FOREIGN KEY ("altId") REFERENCES "alts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "servers" ADD CONSTRAINT "servers_altId_fkey" FOREIGN KEY ("altId") REFERENCES "alts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "server_variables" ADD CONSTRAINT "server_variables_altVariableId_fkey" FOREIGN KEY ("altVariableId") REFERENCES "alt_variables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 9: Drop old constraints and columns
ALTER TABLE "server_variables" DROP CONSTRAINT "server_variables_eggVariableId_fkey";
ALTER TABLE "servers" DROP CONSTRAINT "servers_eggId_fkey";
ALTER TABLE "egg_variables" DROP CONSTRAINT "egg_variables_eggId_fkey";
ALTER TABLE "eggs" DROP CONSTRAINT "eggs_nestId_fkey";

DROP INDEX "server_variables_serverId_eggVariableId_key";

ALTER TABLE "server_variables" DROP COLUMN "eggVariableId";
ALTER TABLE "servers" DROP COLUMN "eggId";

-- Step 10: Create new unique constraint
CREATE UNIQUE INDEX "server_variables_serverId_altVariableId_key" ON "server_variables"("serverId", "altVariableId");

-- Step 11: Drop old tables
DROP TABLE "egg_variables";
DROP TABLE "eggs";
DROP TABLE "nests";
