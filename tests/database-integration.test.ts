import { DatabaseConfigService, DatabaseConfig } from '../src/services/DatabaseConfigService';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Integration Tests', () => {
    describe('Connection String Generation', () => {
        test('PostgreSQL connection string', () => {
            const config: DatabaseConfig = {
                type: 'postgresql',
                host: 'localhost',
                port: 5432,
                database: 'test_db',
                username: 'test_user',
                password: 'test_pass',
                ssl: false
            };

            const connectionString = DatabaseConfigService.buildConnectionString(config);
            expect(connectionString).toBe('postgresql://test_user:test_pass@localhost:5432/test_db');
        });

        test('PostgreSQL connection string with SSL', () => {
            const config: DatabaseConfig = {
                type: 'postgresql',
                host: 'remote.example.com',
                port: 5432,
                database: 'prod_db',
                username: 'prod_user',
                password: 'secure_pass',
                ssl: true
            };

            const connectionString = DatabaseConfigService.buildConnectionString(config);
            expect(connectionString).toBe('postgresql://prod_user:secure_pass@remote.example.com:5432/prod_db?sslmode=require');
        });

        test('MySQL connection string', () => {
            const config: DatabaseConfig = {
                type: 'mysql',
                host: 'localhost',
                port: 3306,
                database: 'test_db',
                username: 'root',
                password: 'mysql_pass',
                ssl: false
            };

            const connectionString = DatabaseConfigService.buildConnectionString(config);
            expect(connectionString).toBe('mysql://root:mysql_pass@localhost:3306/test_db');
        });

        test('MongoDB connection string', () => {
            const config: DatabaseConfig = {
                type: 'mongodb',
                host: 'localhost',
                port: 27017,
                database: 'test_db',
                username: 'mongo_user',
                password: 'mongo_pass',
                ssl: false
            };

            const connectionString = DatabaseConfigService.buildConnectionString(config);
            expect(connectionString).toBe('mongodb://mongo_user:mongo_pass@localhost:27017/test_db');
        });

        test('SQLite connection string with url', () => {
            const config: DatabaseConfig = {
                type: 'sqlite',
                database: 'test_db',
                url: 'file:./data/test.db'
            };

            const connectionString = DatabaseConfigService.buildConnectionString(config);
            expect(connectionString).toBe('file:./data/test.db');
        });
    });

    describe('Validation', () => {
        test('Valid PostgreSQL config', () => {
            const config: DatabaseConfig = {
                type: 'postgresql',
                host: 'localhost',
                port: 5432,
                database: 'test_db',
                username: 'test_user',
                password: 'test_pass'
            };

            const errors = DatabaseConfigService.validateConfig(config);
            expect(errors).toHaveLength(0);
        });

        test('Invalid config - missing required fields', () => {
            const config: DatabaseConfig = {
                type: 'postgresql',
                database: 'test_db'
                // Missing host, port, username, password for non-URL config
            };

            const errors = DatabaseConfigService.validateConfig(config);
            expect(errors.length).toBeGreaterThan(0);
        });

        test('Valid SQLite config with URL', () => {
            const config: DatabaseConfig = {
                type: 'sqlite',
                database: 'test_db',
                url: 'file:./data/test.db'
            };

            const errors = DatabaseConfigService.validateConfig(config);
            expect(errors).toHaveLength(0);
        });
    });

    describe('Docker Configuration Generation', () => {
        test('Generate PostgreSQL Docker config', () => {
            const config: DatabaseConfig = {
                type: 'postgresql',
                host: 'postgres',
                port: 5432,
                database: 'ctrl_alt_play',
                username: 'postgres',
                password: 'docker_password'
            };

            const dockerConfig = DatabaseConfigService.getDockerConfig(config);
            
            expect(dockerConfig).toBeDefined();
            expect(dockerConfig.image).toContain('postgres');
            expect(dockerConfig.environment).toMatchObject({
                POSTGRES_DB: 'ctrl_alt_play',
                POSTGRES_USER: 'postgres',
                POSTGRES_PASSWORD: 'docker_password'
            });
        });

        test('Generate MySQL Docker config', () => {
            const config: DatabaseConfig = {
                type: 'mysql',
                host: 'mysql',
                port: 3306,
                database: 'ctrl_alt_play',
                username: 'root',
                password: 'mysql_password'
            };

            const dockerConfig = DatabaseConfigService.getDockerConfig(config);
            
            expect(dockerConfig).toBeDefined();
            expect(dockerConfig.image).toContain('mysql');
            expect(dockerConfig.environment).toMatchObject({
                MYSQL_DATABASE: 'ctrl_alt_play',
                MYSQL_ROOT_PASSWORD: 'mysql_password'
            });
        });

        test('Generate MongoDB Docker config', () => {
            const config: DatabaseConfig = {
                type: 'mongodb',
                host: 'mongodb',
                port: 27017,
                database: 'ctrl_alt_play',
                username: 'admin',
                password: 'mongo_password'
            };

            const dockerConfig = DatabaseConfigService.getDockerConfig(config);
            
            expect(dockerConfig).toBeDefined();
            expect(dockerConfig.image).toContain('mongo');
            expect(dockerConfig.environment).toMatchObject({
                MONGO_INITDB_ROOT_USERNAME: 'admin',
                MONGO_INITDB_ROOT_PASSWORD: 'mongo_password',
                MONGO_INITDB_DATABASE: 'ctrl_alt_play'
            });
        });
    });

    describe('Prisma Configuration Generation', () => {
        test('Generate PostgreSQL Prisma config', () => {
            const config: DatabaseConfig = {
                type: 'postgresql',
                host: 'localhost',
                port: 5432,
                database: 'ctrl_alt_play',
                username: 'postgres',
                password: 'test_password'
            };

            const prismaConfig = DatabaseConfigService.generatePrismaConfig(config);
            
            expect(prismaConfig).toContain('generator client');
            expect(prismaConfig).toContain('datasource db');
            expect(prismaConfig).toContain('provider = "postgresql"');
            expect(prismaConfig).toContain('url = "postgresql://postgres:test_password@localhost:5432/ctrl_alt_play"');
        });

        test('Generate MySQL Prisma config', () => {
            const config: DatabaseConfig = {
                type: 'mysql',
                host: 'localhost',
                port: 3306,
                database: 'ctrl_alt_play',
                username: 'root',
                password: 'mysql_password'
            };

            const prismaConfig = DatabaseConfigService.generatePrismaConfig(config);
            
            expect(prismaConfig).toContain('provider = "mysql"');
            expect(prismaConfig).toContain('url = "mysql://root:mysql_password@localhost:3306/ctrl_alt_play"');
        });

        test('Generate MongoDB Prisma config', () => {
            const config: DatabaseConfig = {
                type: 'mongodb',
                host: 'localhost',
                port: 27017,
                database: 'ctrl_alt_play',
                username: 'admin',
                password: 'mongo_password'
            };

            const prismaConfig = DatabaseConfigService.generatePrismaConfig(config);
            
            expect(prismaConfig).toContain('provider = "mongodb"');
            expect(prismaConfig).toContain('url = "mongodb://admin:mongo_password@localhost:27017/ctrl_alt_play"');
        });

        test('Generate SQLite Prisma config', () => {
            const config: DatabaseConfig = {
                type: 'sqlite',
                database: 'ctrl_alt_play',
                url: 'file:./data/ctrl_alt_play.db'
            };

            const prismaConfig = DatabaseConfigService.generatePrismaConfig(config);
            
            expect(prismaConfig).toContain('provider = "sqlite"');
            expect(prismaConfig).toContain('url = "file:./data/ctrl_alt_play.db"');
        });
    });

    describe('Script Integration', () => {
        test('Setup wizard script exists and is executable', () => {
            const scriptPath = path.join(__dirname, '..', 'scripts', 'setup-wizard.sh');
            expect(fs.existsSync(scriptPath)).toBe(true);
            
            const stats = fs.statSync(scriptPath);
            expect(stats.mode & 0o111).toBeTruthy(); // Check if executable
        });

        test('Generate docker compose script exists and is executable', () => {
            const scriptPath = path.join(__dirname, '..', 'scripts', 'generate-docker-compose.sh');
            expect(fs.existsSync(scriptPath)).toBe(true);
            
            const stats = fs.statSync(scriptPath);
            expect(stats.mode & 0o111).toBeTruthy(); // Check if executable
        });

        test('Quick deploy script has database selection', () => {
            const scriptPath = path.join(__dirname, '..', 'scripts', 'quick-deploy.sh');
            expect(fs.existsSync(scriptPath)).toBe(true);
            
            const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
            expect(scriptContent).toContain('select_database_quick_deploy');
            expect(scriptContent).toContain('--postgresql');
            expect(scriptContent).toContain('--mysql');
            expect(scriptContent).toContain('--mongodb');
            expect(scriptContent).toContain('--sqlite');
        });

        test('Web installer has database configuration UI', () => {
            const scriptPath = path.join(__dirname, '..', 'scripts', 'setup-web.sh');
            expect(fs.existsSync(scriptPath)).toBe(true);
            
            const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
            expect(scriptContent).toContain('updateDatabaseOptions');
            expect(scriptContent).toContain('testDatabaseConnection');
            expect(scriptContent).toContain('DB_TYPE');
            expect(scriptContent).toContain('DB_LOCAL');
        });

        test('Environment example has multi-database support', () => {
            const envPath = path.join(__dirname, '..', '.env.example');
            expect(fs.existsSync(envPath)).toBe(true);
            
            const envContent = fs.readFileSync(envPath, 'utf-8');
            expect(envContent).toContain('DB_TYPE=');
            expect(envContent).toContain('DB_LOCAL=');
            expect(envContent).toContain('# Database Types: postgresql, mysql, mariadb, mongodb, sqlite');
        });

        test('Docker compose generation with PostgreSQL', () => {
            const scriptPath = path.join(__dirname, '..', 'scripts', 'generate-docker-compose.sh');
            const testDir = path.join(__dirname, 'temp-docker-test');
            
            // Create test directory
            if (!fs.existsSync(testDir)) {
                fs.mkdirSync(testDir, { recursive: true });
            }
            
            try {
                // Set environment variables and run script
                const env = {
                    ...process.env,
                    DB_TYPE: 'postgresql',
                    DB_LOCAL: 'true',
                    DB_NAME: 'test_db',
                    DB_USER: 'test_user',
                    DB_PASSWORD: 'test_password',
                    NODE_ENV: 'production' as const,
                    PORT: '3000'
                } as NodeJS.ProcessEnv;
                
                execSync(`cd ${testDir} && bash ${scriptPath}`, { 
                    env,
                    encoding: 'utf-8',
                    timeout: 10000
                });
                
                // Check that docker-compose.yml was created
                const dockerComposePath = path.join(testDir, 'docker-compose.yml');
                expect(fs.existsSync(dockerComposePath)).toBe(true);
                
                const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf-8');
                expect(dockerComposeContent).toContain('postgres:');
                expect(dockerComposeContent).toContain('POSTGRES_DB: test_db');
                expect(dockerComposeContent).toContain('POSTGRES_USER: test_user');
                
            } finally {
                // Clean up test directory
                if (fs.existsSync(testDir)) {
                    fs.rmSync(testDir, { recursive: true, force: true });
                }
            }
        });
    });
});
