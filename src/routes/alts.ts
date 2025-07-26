import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get all Alts (Server configurations)
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { ctrlId } = req.query;

  const alts = await prisma.alt.findMany({
    where: ctrlId ? { ctrlId: ctrlId as string } : undefined,
    include: {
      ctrl: {
        select: {
          id: true,
          name: true
        }
      },
      variables: true,
      _count: {
        select: {
          servers: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    data: alts
  });
}));

// Get specific Alt by ID
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const alt = await prisma.alt.findUnique({
    where: { id },
    include: {
      ctrl: true,
      variables: true,
      servers: {
        select: {
          id: true,
          name: true,
          status: true,
          user: {
            select: {
              username: true
            }
          }
        }
      }
    }
  });

  if (!alt) {
    throw createError('Alt not found', 404);
  }

  res.json({
    success: true,
    data: alt
  });
}));

// Create new Alt (Admin only)
router.post('/', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { 
    name, 
    description, 
    author, 
    version,
    changelog,
    ctrlId, 
    dockerImages, 
    startup, 
    configFiles, 
    configStartup, 
    configLogs, 
    configStop,
    scriptInstall,
    scriptEntry,
    scriptContainer,
    variables 
  } = req.body;

  if (!name || !ctrlId || !author || !startup) {
    throw createError('Name, Ctrl ID, author, and startup command are required', 400);
  }

  // Check if Ctrl exists
  const ctrl = await prisma.ctrl.findUnique({
    where: { id: ctrlId }
  });

  if (!ctrl) {
    throw createError('Ctrl not found', 404);
  }

  const alt = await prisma.alt.create({
    data: {
      name,
      description,
      author,
      version: version || '1.0.0',
      changelog: changelog || 'Initial version',
      ctrlId,
      dockerImages: dockerImages || {},
      startup,
      configFiles: configFiles || {},
      configStartup: configStartup || {},
      configLogs: configLogs || {},
      configStop,
      scriptInstall,
      scriptEntry: scriptEntry || 'bash',
      scriptContainer: scriptContainer || 'alpine:3.4',
      variables: {
        create: variables || []
      }
    },
    include: {
      variables: true
    }
  });

  logger.info(`New Alt created: ${alt.name} v${alt.version} in Ctrl: ${ctrl.name}`);

  res.status(201).json({
    success: true,
    data: alt,
    message: 'Alt created successfully'
  });
}));

// Update Alt (Admin only)
router.patch('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove variables from update data if present - handle separately
  // variables is destructured but not used to prevent it from being passed to Prisma update
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variables, ...altUpdateData } = updateData;

  const updatedAlt = await prisma.alt.update({
    where: { id },
    data: altUpdateData,
    include: {
      variables: true
    }
  });

  logger.info(`Alt updated: ${updatedAlt.name}`);

  res.json({
    success: true,
    data: updatedAlt,
    message: 'Alt updated successfully'
  });
}));

// Delete Alt (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if Alt has any servers
  const altWithServers = await prisma.alt.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          servers: true
        }
      }
    }
  });

  if (!altWithServers) {
    throw createError('Alt not found', 404);
  }

  if (altWithServers._count.servers > 0) {
    throw createError('Cannot delete Alt with existing servers', 400);
  }

  await prisma.alt.delete({
    where: { id }
  });

  logger.info(`Alt deleted: ${id}`);

  res.json({
    success: true,
    message: 'Alt deleted successfully'
  });
}));

// Get Alt variables
router.get('/:id/variables', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const variables = await prisma.altVariable.findMany({
    where: { altId: id },
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    data: variables
  });
}));

// Add variable to Alt (Admin only)
router.post('/:id/variables', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, envVariable, defaultValue, userViewable, userEditable, rules } = req.body;

  if (!name || !envVariable) {
    throw createError('Name and environment variable are required', 400);
  }

  const variable = await prisma.altVariable.create({
    data: {
      name,
      description: description || '',
      envVariable,
      defaultValue: defaultValue || '',
      userViewable: userViewable !== false,
      userEditable: userEditable !== false,
      rules: rules || 'required|string',
      altId: id
    }
  });

  res.status(201).json({
    success: true,
    data: variable,
    message: 'Variable added successfully'
  });
}));

// Export Alt as JSON (Pterodactyl-compatible format)
router.get('/:id/export', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const alt = await prisma.alt.findUnique({
    where: { id },
    include: {
      ctrl: true,
      variables: true
    }
  });

  if (!alt) {
    throw createError('Alt not found', 404);
  }

  // Convert to Pterodactyl-compatible egg format
  const eggData = {
    _comment: "DO NOT EDIT: FILE GENERATED AUTOMATICALLY BY CTRL-ALT-PLAY PANEL",
    meta: {
      version: "PTDL_v2",
      update_url: null
    },
    exported_at: new Date().toISOString(),
    name: alt.name,
    author: alt.author,
    description: alt.description || "",
    features: alt.features || [],
    docker_images: alt.dockerImages,
    file_denylist: alt.fileDenylist || [],
    startup: alt.startup,
    config: {
      files: alt.configFiles,
      startup: alt.configStartup,
      logs: alt.configLogs,
      stop: alt.configStop || "^C"
    },
    scripts: {
      installation: {
        script: alt.scriptInstall || "",
        container: alt.scriptContainer,
        entrypoint: alt.scriptEntry
      }
    },
    variables: alt.variables.map((variable: any) => ({
      name: variable.name,
      description: variable.description,
      env_variable: variable.envVariable,
      default_value: variable.defaultValue,
      user_viewable: variable.userViewable,
      user_editable: variable.userEditable,
      rules: variable.rules
    }))
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${alt.name.replace(/[^a-zA-Z0-9]/g, '_')}.json"`);
  res.json(eggData);
}));

// Import Alt from JSON (Pterodactyl egg format)
router.post('/import', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { ctrlId, eggData, overrideName } = req.body;

  if (!ctrlId || !eggData) {
    throw createError('Ctrl ID and egg data are required', 400);
  }

  // Validate that Ctrl exists
  const ctrl = await prisma.ctrl.findUnique({
    where: { id: ctrlId }
  });

  if (!ctrl) {
    throw createError('Ctrl not found', 404);
  }

  try {
    // Parse egg data if it's a string
    const egg = typeof eggData === 'string' ? JSON.parse(eggData) : eggData;

    // Extract alt data from egg format
    const altData = {
      name: overrideName || egg.name,
      description: egg.description || '',
      author: egg.author || 'Imported',
      version: '1.0.0',
      changelog: 'Imported from egg file',
      dockerImages: egg.docker_images || {},
      startup: egg.startup || '',
      configFiles: egg.config?.files || {},
      configStartup: egg.config?.startup || {},
      configLogs: egg.config?.logs || {},
      configStop: egg.config?.stop || '^C',
      scriptInstall: egg.scripts?.installation?.script || '',
      scriptEntry: egg.scripts?.installation?.entrypoint || 'bash',
      scriptContainer: egg.scripts?.installation?.container || 'alpine:3.4',
      features: egg.features || [],
      fileDenylist: egg.file_denylist || [],
      ctrlId
    };

    // Create Alt with variables
    const alt = await prisma.alt.create({
      data: {
        ...altData,
        variables: {
          create: (egg.variables || []).map((variable: any) => ({
            name: variable.name,
            description: variable.description || '',
            envVariable: variable.env_variable,
            defaultValue: variable.default_value || '',
            userViewable: variable.user_viewable !== false,
            userEditable: variable.user_editable !== false,
            rules: variable.rules || 'required|string'
          }))
        }
      },
      include: {
        variables: true
      }
    });

    logger.info(`Alt imported from egg: ${alt.name} in Ctrl: ${ctrl.name}`);

    res.status(201).json({
      success: true,
      data: alt,
      message: 'Alt imported successfully from egg file'
    });

  } catch (error) {
    logger.error('Failed to import egg:', error);
    throw createError('Invalid egg file format', 400);
  }
}));

// Preview Alt configuration with variable substitution
router.post('/:id/preview', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { variables: inputVariables } = req.body;

  const alt = await prisma.alt.findUnique({
    where: { id },
    include: {
      variables: true
    }
  });

  if (!alt) {
    throw createError('Alt not found', 404);
  }

  // Merge input variables with defaults
  const variableValues: { [key: string]: string } = {};
  
  alt.variables.forEach((variable: any) => {
    variableValues[variable.envVariable] = inputVariables?.[variable.envVariable] || variable.defaultValue;
  });

  // Perform variable substitution on startup command
  let processedStartup = alt.startup;
  Object.entries(variableValues).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedStartup = processedStartup.replace(regex, value);
  });

  // Process config files
  const processedConfigFiles: any = {};
  if (alt.configFiles && typeof alt.configFiles === 'object') {
    Object.entries(alt.configFiles).forEach(([filename, content]) => {
      let processedContent = content as string;
      Object.entries(variableValues).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedContent = processedContent.replace(regex, value);
      });
      processedConfigFiles[filename] = processedContent;
    });
  }

  res.json({
    success: true,
    data: {
      alt: {
        id: alt.id,
        name: alt.name,
        description: alt.description,
        version: alt.version
      },
      preview: {
        startup: processedStartup,
        configFiles: processedConfigFiles,
        environment: variableValues
      },
      variables: alt.variables.map((variable: any) => ({
        ...variable,
        currentValue: variableValues[variable.envVariable]
      }))
    }
  });
}));

// Validate Alt configuration
router.post('/:id/validate', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { variables: inputVariables } = req.body;

  const alt = await prisma.alt.findUnique({
    where: { id },
    include: {
      variables: true
    }
  });

  if (!alt) {
    throw createError('Alt not found', 404);
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!alt.startup.trim()) {
    errors.push('Startup command is required');
  }

  if (!alt.author.trim()) {
    errors.push('Author is required');
  }

  // Validate Docker images
  try {
    if (typeof alt.dockerImages !== 'object' || Array.isArray(alt.dockerImages)) {
      errors.push('Docker images must be a valid JSON object');
    }
  } catch (e) {
    errors.push('Invalid Docker images configuration');
  }

  // Validate variables
  const variableValues: { [key: string]: string } = {};
  alt.variables.forEach((variable: any) => {
    const value = inputVariables?.[variable.envVariable] || variable.defaultValue;
    variableValues[variable.envVariable] = value;

    // Check if required variables have values
    if (variable.rules.includes('required') && !value.trim()) {
      errors.push(`Variable '${variable.name}' is required but has no value`);
    }

    // Check variable substitution
    if (alt.startup.includes(`{{${variable.envVariable}}}`) && !value.trim()) {
      warnings.push(`Variable '${variable.name}' is used in startup but has no value`);
    }
  });

  // Check for undefined variables in startup command
  const variableMatches = alt.startup.match(/{{([^}]+)}}/g);
  if (variableMatches) {
    variableMatches.forEach((match: string) => {
      const varName = match.replace(/[{}]/g, '');
      if (!variableValues[varName]) {
        errors.push(`Undefined variable '${varName}' used in startup command`);
      }
    });
  }

  res.json({
    success: true,
    data: {
      valid: errors.length === 0,
      errors,
      warnings,
      variableCount: alt.variables.length,
      requiredVariableCount: alt.variables.filter((v: any) => v.rules.includes('required')).length
    }
  });
}));

// Clone Alt (create copy with new version)
router.post('/:id/clone', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, version, changelog } = req.body;

  const originalAlt = await prisma.alt.findUnique({
    where: { id },
    include: {
      variables: true
    }
  });

  if (!originalAlt) {
    throw createError('Alt not found', 404);
  }

  if (!name) {
    throw createError('Name is required for cloned Alt', 400);
  }

  // Create cloned Alt
  const clonedAlt = await prisma.alt.create({
    data: {
      name,
      description: originalAlt.description,
      author: originalAlt.author,
      version: version || '1.0.0',
      changelog: changelog || `Cloned from ${originalAlt.name}`,
      dockerImages: originalAlt.dockerImages as Prisma.InputJsonValue,
      startup: originalAlt.startup,
      configFiles: originalAlt.configFiles as Prisma.InputJsonValue,
      configStartup: originalAlt.configStartup as Prisma.InputJsonValue,
      configLogs: originalAlt.configLogs as Prisma.InputJsonValue,
      configStop: originalAlt.configStop,
      scriptInstall: originalAlt.scriptInstall,
      scriptEntry: originalAlt.scriptEntry,
      scriptContainer: originalAlt.scriptContainer,
      copyScriptFrom: originalAlt.copyScriptFrom,
      features: originalAlt.features as Prisma.InputJsonValue,
      fileDenylist: originalAlt.fileDenylist as Prisma.InputJsonValue,
      forceOutgoingIp: originalAlt.forceOutgoingIp,
      ctrlId: originalAlt.ctrlId,
      variables: {
        create: originalAlt.variables.map((variable: any) => ({
          name: variable.name,
          description: variable.description,
          envVariable: variable.envVariable,
          defaultValue: variable.defaultValue,
          userViewable: variable.userViewable,
          userEditable: variable.userEditable,
          rules: variable.rules
        }))
      }
    },
    include: {
      variables: true
    }
  });

  logger.info(`Alt cloned: ${originalAlt.name} -> ${clonedAlt.name}`);

  res.status(201).json({
    success: true,
    data: clonedAlt,
    message: 'Alt cloned successfully'
  });
}));

export default router;
