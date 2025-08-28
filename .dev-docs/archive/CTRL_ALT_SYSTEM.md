# Ctrl-Alt Management System

The Ctrl-Alt management system is inspired by Pterodactyl Panel's eggs and nests architecture, providing a powerful way to manage server configurations and categories.

## Overview

- **Ctrls (Categories)**: Organizational containers for server configurations, similar to Pterodactyl's "nests"
- **Alts (Configurations)**: Server configuration templates, similar to Pterodactyl's "eggs"
- **Variables**: Configurable parameters for each Alt that users can customize when creating servers

## Components

### 1. Database Schema

The system uses three main Prisma models:

```prisma
model Ctrl {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  alts        Alt[]
}

model Alt {
  id              String        @id @default(cuid())
  uuid            String        @unique @default(cuid())
  name            String
  description     String?
  author          String
  dockerImages    Json          @default("{}")
  startup         String
  configFiles     Json          @default("{}")
  configStartup   Json          @default("{}")
  configLogs      Json          @default("{}")
  configStop      String?
  scriptInstall   String?
  scriptEntry     String
  scriptContainer String
  copyScriptFrom  String?
  features        Json?         @default("{}")
  fileDenylist    Json?         @default("[]")
  forceOutgoingIp Boolean       @default(false)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  ctrlId          String
  ctrl            Ctrl          @relation(fields: [ctrlId], references: [id], onDelete: Cascade)
  variables       AltVariable[]
  servers         Server[]
}

model AltVariable {
  id           String  @id @default(cuid())
  name         String
  description  String
  envVariable  String
  defaultValue String
  userViewable Boolean @default(true)
  userEditable Boolean @default(true)
  rules        String  @default("")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  altId        String
  alt          Alt     @relation(fields: [altId], references: [id], onDelete: Cascade)
}
```

### 2. Backend API Routes

#### Ctrls API (`/api/ctrls`)
- `GET /api/ctrls` - List all categories
- `GET /api/ctrls/:id` - Get specific category
- `POST /api/ctrls` - Create new category (admin only)
- `PUT /api/ctrls/:id` - Update category (admin only)
- `DELETE /api/ctrls/:id` - Delete category (admin only)

#### Alts API (`/api/alts`)
- `GET /api/alts?ctrlId=:id` - List configurations for a category
- `GET /api/alts/:id` - Get specific configuration
- `POST /api/alts` - Create new configuration (admin only)
- `PUT /api/alts/:id` - Update configuration (admin only)
- `DELETE /api/alts/:id` - Delete configuration (admin only)
- `POST /api/alts/import` - Import Pterodactyl egg JSON (admin only)
- `GET /api/alts/:id/export` - Export configuration as JSON

### 3. Frontend Pages

#### `/ctrls` - Categories Management
- View all server categories (Ctrls)
- Create new categories
- Manage configurations (Alts) within each category
- Import Pterodactyl egg files
- Export configurations

#### `/alts/[id]` - Configuration Editor
- Edit Alt configuration details
- Manage environment variables
- Configure Docker images and scripts
- Set startup commands and configuration files
- Export configuration as Pterodactyl-compatible JSON

#### `/servers/create` - Server Creation Wizard
- Step 1: Choose category (Ctrl)
- Step 2: Choose configuration (Alt)
- Step 3: Configure server settings and environment variables

## Features

### Import/Export Compatibility
- **Import**: Accepts Pterodactyl egg JSON files
- **Export**: Generates Pterodactyl-compatible JSON files
- **Migration**: Easy migration from Pterodactyl to Ctrl-Alt-Play

### Environment Variables
- **User Viewable**: Controls if users can see the variable
- **User Editable**: Controls if users can modify the variable
- **Default Values**: Pre-configured defaults for new servers
- **Validation Rules**: Optional validation patterns

### Configuration Structure
Each Alt contains:
- **Docker Images**: JSON object mapping image names to Docker images
- **Startup Command**: Template with variable substitution
- **Scripts**: Install, entry, and container scripts
- **Config Files**: JSON configuration for file templates
- **Features**: Additional features and capabilities
- **File Deny List**: Files that should not be accessible

## Usage Examples

### Creating a Minecraft Category
1. Navigate to `/ctrls`
2. Click "New Category"
3. Name: "Minecraft Servers"
4. Description: "Various Minecraft server configurations"

### Importing a Minecraft Alt
1. Select the "Minecraft Servers" category
2. Click "Import Alt"
3. Upload a Pterodactyl Minecraft egg JSON file
4. The system automatically creates the Alt with all variables

### Creating a Server
1. Go to `/servers/create`
2. Choose "Minecraft Servers" category
3. Select "Vanilla Minecraft" configuration
4. Configure memory, disk, and environment variables
5. Click "Create Server"

## Migration from Pterodactyl

The system is designed to be compatible with Pterodactyl eggs:

1. **Export** eggs from Pterodactyl as JSON files
2. **Create** appropriate Ctrls (categories) in Ctrl-Alt-Play
3. **Import** the egg JSON files into the corresponding Ctrls
4. **Verify** that all variables and settings transferred correctly

## Administration

### Access Control
- **Admin Only**: Creating, editing, and deleting Ctrls and Alts requires admin privileges
- **User Access**: Regular users can view available configurations and create servers using them

### Best Practices
1. **Organize** configurations into logical categories
2. **Document** Alt descriptions clearly
3. **Test** configurations before making them available to users
4. **Backup** configurations by exporting them regularly
5. **Version Control** important configurations

## Technical Notes

### Variable Substitution
Variables are substituted in startup commands using the format `{{VARIABLE_NAME}}`. The system supports:
- Environment variables from AltVariable definitions
- System variables like `{{SERVER_MEMORY}}` and `{{SERVER_JARFILE}}`

### JSON Configuration
All JSON fields (dockerImages, configFiles, etc.) support full JSON syntax and are validated on save.

### File Management
The fileDenylist prevents users from accessing sensitive files and follows glob patterns for flexible matching.

This system provides a powerful, flexible foundation for managing game server configurations while maintaining compatibility with the Pterodactyl ecosystem.

## Testing

The Ctrl-Alt system includes comprehensive test coverage:

### Test Suite Coverage

1. **Integration Tests** (`tests/integration/ctrl-alt-system.test.ts`)
   - Database schema validation
   - CRUD operations for Ctrls and Alts
   - Environment variable management
   - Pterodactyl egg import/export compatibility
   - Data integrity and cascade operations

2. **API Tests** (`tests/api/`)
   - `ctrls.test.ts` - Ctrl management API endpoints
   - `alts.test.ts` - Alt management API endpoints
   - Authentication and authorization testing
   - Error handling and validation

### Running Tests

```bash
# Run all Ctrl-Alt system tests
./test-ctrl-alt.sh

# Run specific test suites
npm test tests/integration/ctrl-alt-system.test.ts
npm test tests/api/ctrls.test.ts
npm test tests/api/alts.test.ts

# Run with coverage
npm test -- --coverage --testPathPattern="tests/(integration|api)"
```

### Test Requirements

- PostgreSQL running on localhost:5432
- Test database: `ctrl_alt_test`
- Environment variables:
  - `NODE_ENV=test`
  - `JWT_SECRET=test-secret-key`
  - `DATABASE_URL="postgresql://test:test@localhost:5432/ctrl_alt_test"`

### Test Data

Tests use isolated test data and clean up after execution:
- Test users with admin and regular roles
- Sample Ctrl categories
- Sample Alt configurations with variables
- Pterodactyl egg format validation
