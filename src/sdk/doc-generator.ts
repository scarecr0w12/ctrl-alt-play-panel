/**
 * Plugin Documentation Generator
 * Automatically generate documentation from plugin code and configuration
 */

import * as fs from 'fs';
import * as path from 'path';
import { DocGenerationOptions } from './types';
import { PluginConfigUtils } from './utils';

export class DocGenerator {
  private pluginPath: string;
  private options: DocGenerationOptions;

  constructor(pluginPath: string, options: Partial<DocGenerationOptions> = {}) {
    this.pluginPath = path.resolve(pluginPath);
    this.options = {
      output: 'docs',
      format: 'html',
      includeExamples: true,
      includeApi: true,
      template: 'default',
      ...options
    };
  }

  async generateDocs(): Promise<void> {
    console.log('📚 Generating plugin documentation...');
    
    // Create output directory
    const outputPath = path.resolve(this.options.output);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Load plugin configuration
    const config = PluginConfigUtils.loadConfig(this.pluginPath);
    
    // Extract documentation data
    const docData = await this.extractDocumentationData(config);
    
    // Generate documentation based on format
    switch (this.options.format) {
      case 'html':
        await this.generateHtmlDocs(docData, outputPath);
        break;
      case 'markdown':
        await this.generateMarkdownDocs(docData, outputPath);
        break;
      case 'json':
        await this.generateJsonDocs(docData, outputPath);
        break;
      default:
        throw new Error(`Unsupported documentation format: ${this.options.format}`);
    }
    
    console.log(`✅ Documentation generated in ${outputPath}`);
  }

  private async extractDocumentationData(config: any): Promise<any> {
    const docData = {
      plugin: config,
      structure: await this.analyzePluginStructure(),
      api: this.options.includeApi ? await this.extractApiDocumentation() : null,
      examples: this.options.includeExamples ? await this.extractExamples() : null,
      dependencies: await this.analyzeDependencies(),
      files: await this.catalogFiles()
    };

    return docData;
  }

  private async analyzePluginStructure(): Promise<any> {
    const structure = {
      files: [],
      directories: [],
      entryPoint: 'index.js',
      hasTests: false,
      hasAssets: false,
      hasComponents: false
    };

    const scanDirectory = (dir: string, basePath: string = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }
        
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(basePath, entry.name);
        
        if (entry.isDirectory()) {
          structure.directories.push(relativePath);
          
          // Check for special directories
          if (entry.name === 'tests' || entry.name === '__tests__') {
            structure.hasTests = true;
          } else if (entry.name === 'assets') {
            structure.hasAssets = true;
          } else if (entry.name === 'components') {
            structure.hasComponents = true;
          }
          
          scanDirectory(fullPath, relativePath);
        } else {
          structure.files.push({
            path: relativePath,
            size: fs.statSync(fullPath).size,
            extension: path.extname(entry.name)
          });
        }
      }
    };

    scanDirectory(this.pluginPath);
    return structure;
  }

  private async extractApiDocumentation(): Promise<any> {
    const apiDocs = {
      routes: [],
      hooks: [],
      events: [],
      methods: []
    };

    // Extract API routes from plugin configuration
    const config = PluginConfigUtils.loadConfig(this.pluginPath);
    if (config.apis) {
      apiDocs.routes = config.apis;
    }

    // Extract hooks
    if (config.hooks) {
      apiDocs.hooks = config.hooks;
    }

    // Analyze main file for additional API information
    const mainPath = path.join(this.pluginPath, 'index.js');
    if (fs.existsSync(mainPath)) {
      const content = fs.readFileSync(mainPath, 'utf-8');
      
      // Extract method signatures (basic parsing)
      const methodMatches = content.match(/async\s+(\w+)\s*\([^)]*\)/g) || [];
      apiDocs.methods = methodMatches.map(match => {
        const nameMatch = match.match(/async\s+(\w+)/);
        return {
          name: nameMatch ? nameMatch[1] : 'unknown',
          signature: match,
          async: true
        };
      });

      // Extract event emissions
      const eventMatches = content.match(/\.emit\s*\(\s*['"`]([^'"`]+)['"`]/g) || [];
      apiDocs.events = eventMatches.map(match => {
        const nameMatch = match.match(/['"`]([^'"`]+)['"`]/);
        return {
          name: nameMatch ? nameMatch[1] : 'unknown',
          type: 'emit'
        };
      });
    }

    return apiDocs;
  }

  private async extractExamples(): Promise<any> {
    const examples = {
      usage: [],
      configuration: [],
      api: []
    };

    // Look for examples in README
    const readmePath = path.join(this.pluginPath, 'README.md');
    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, 'utf-8');
      
      // Extract code blocks
      const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
      examples.usage = codeBlocks.map(block => {
        const lines = block.split('\n');
        const language = lines[0].replace('```', '') || 'text';
        const code = lines.slice(1, -1).join('\n');
        
        return {
          language,
          code,
          description: 'Usage example from README'
        };
      });
    }

    // Look for example configuration files
    const examplePaths = [
      path.join(this.pluginPath, 'examples'),
      path.join(this.pluginPath, 'samples'),
      path.join(this.pluginPath, 'demo')
    ];

    for (const examplePath of examplePaths) {
      if (fs.existsSync(examplePath)) {
        const files = fs.readdirSync(examplePath);
        for (const file of files) {
          const filePath = path.join(examplePath, file);
          if (fs.statSync(filePath).isFile()) {
            const content = fs.readFileSync(filePath, 'utf-8');
            examples.configuration.push({
              filename: file,
              content,
              description: `Example configuration: ${file}`
            });
          }
        }
      }
    }

    return examples;
  }

  private async analyzeDependencies(): Promise<any> {
    const packageJsonPath = path.join(this.pluginPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    return {
      production: packageJson.dependencies || {},
      development: packageJson.devDependencies || {},
      peer: packageJson.peerDependencies || {},
      scripts: packageJson.scripts || {}
    };
  }

  private async catalogFiles(): Promise<any> {
    const catalog = {
      total: 0,
      byType: {},
      documentation: [],
      configuration: [],
      source: []
    };

    const scanFiles = (dir: string, basePath: string = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }
        
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(basePath, entry.name);
        
        if (entry.isDirectory()) {
          scanFiles(fullPath, relativePath);
        } else {
          catalog.total++;
          
          const ext = path.extname(entry.name);
          catalog.byType[ext] = (catalog.byType[ext] || 0) + 1;
          
          // Categorize files
          if (['.md', '.txt', '.pdf'].includes(ext)) {
            catalog.documentation.push(relativePath);
          } else if (['.yaml', '.yml', '.json', '.xml'].includes(ext)) {
            catalog.configuration.push(relativePath);
          } else if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
            catalog.source.push(relativePath);
          }
        }
      }
    };

    scanFiles(this.pluginPath);
    return catalog;
  }

  private async generateHtmlDocs(docData: any, outputPath: string): Promise<void> {
    const htmlContent = this.generateHtmlContent(docData);
    fs.writeFileSync(path.join(outputPath, 'index.html'), htmlContent);
    
    // Copy assets if using default template
    if (this.options.template === 'default') {
      await this.copyDefaultAssets(outputPath);
    }
  }

  private generateHtmlContent(docData: any): string {
    const { plugin, structure, api, examples, dependencies, files } = docData;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${plugin.name} - Plugin Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        h1 { border-bottom: 3px solid #007acc; padding-bottom: 10px; }
        h2 { border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; }
        .meta { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007acc; }
        .badge { background: #007acc; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
        .code { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: #f8f9fa; padding: 20px; border-radius: 5px; border: 1px solid #dee2e6; }
        .list { list-style: none; padding: 0; }
        .list li { padding: 8px 0; border-bottom: 1px solid #eee; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .nav { position: sticky; top: 20px; background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .nav ul { list-style: none; padding: 0; margin: 0; }
        .nav li { margin: 5px 0; }
        .nav a { text-decoration: none; color: #007acc; font-weight: 500; }
        .nav a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="nav">
            <h3>Navigation</h3>
            <ul>
                <li><a href="#overview">Overview</a></li>
                <li><a href="#installation">Installation</a></li>
                <li><a href="#configuration">Configuration</a></li>
                ${api ? '<li><a href="#api">API Reference</a></li>' : ''}
                ${examples ? '<li><a href="#examples">Examples</a></li>' : ''}
                <li><a href="#structure">Plugin Structure</a></li>
                ${dependencies ? '<li><a href="#dependencies">Dependencies</a></li>' : ''}
            </ul>
        </div>

        <header>
            <h1>${plugin.name}</h1>
            <p class="lead">${plugin.description || 'No description provided'}</p>
            
            <div class="meta">
                <div class="grid">
                    <div>
                        <strong>Version:</strong> <span class="badge">${plugin.version}</span><br>
                        <strong>Author:</strong> ${plugin.author}<br>
                        <strong>Generated:</strong> ${new Date().toLocaleDateString()}
                    </div>
                    <div>
                        <strong>Files:</strong> ${files.total}<br>
                        <strong>Has Tests:</strong> ${structure.hasTests ? '✅' : '❌'}<br>
                        <strong>Has Components:</strong> ${structure.hasComponents ? '✅' : '❌'}
                    </div>
                </div>
            </div>
        </header>

        <section id="overview">
            <h2>Overview</h2>
            <p>This plugin provides ${plugin.description || 'functionality for the CTRL-ALT-PLAY panel'}.</p>
            
            ${plugin.permissions ? `
            <h3>Permissions</h3>
            <div class="grid">
                ${Object.entries(plugin.permissions).map(([key, value]) => `
                    <div class="card">
                        <strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> 
                        ${value ? '<span style="color: green;">✅ Enabled</span>' : '<span style="color: red;">❌ Disabled</span>'}
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </section>

        <section id="installation">
            <h2>Installation</h2>
            <div class="code">
                <pre># Install the plugin
plugin-cli install ./${plugin.name}

# Enable the plugin
plugin-cli enable ${plugin.name}

# Check status
plugin-cli list</pre>
            </div>
        </section>

        <section id="configuration">
            <h2>Configuration</h2>
            <p>Plugin configuration is managed through the <code>plugin.yaml</code> file:</p>
            <div class="code">
                <pre>${JSON.stringify(plugin, null, 2)}</pre>
            </div>
        </section>

        ${api ? `
        <section id="api">
            <h2>API Reference</h2>
            
            ${api.routes && api.routes.length > 0 ? `
            <h3>Routes</h3>
            <table>
                <thead>
                    <tr>
                        <th>Method</th>
                        <th>Path</th>
                        <th>Handler</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    ${api.routes.map(route => `
                        <tr>
                            <td><span class="badge">${route.method}</span></td>
                            <td><code>${route.path}</code></td>
                            <td>${route.handler}</td>
                            <td>${route.description || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : ''}

            ${api.methods && api.methods.length > 0 ? `
            <h3>Methods</h3>
            <ul class="list">
                ${api.methods.map(method => `
                    <li>
                        <code>${method.signature}</code>
                        ${method.async ? '<span class="badge">async</span>' : ''}
                    </li>
                `).join('')}
            </ul>
            ` : ''}

            ${api.events && api.events.length > 0 ? `
            <h3>Events</h3>
            <ul class="list">
                ${api.events.map(event => `
                    <li><code>${event.name}</code> - ${event.type}</li>
                `).join('')}
            </ul>
            ` : ''}
        </section>
        ` : ''}

        ${examples ? `
        <section id="examples">
            <h2>Examples</h2>
            
            ${examples.usage && examples.usage.length > 0 ? `
            <h3>Usage Examples</h3>
            ${examples.usage.map((example, i) => `
                <div class="code">
                    <h4>Example ${i + 1} (${example.language})</h4>
                    <pre><code>${example.code}</code></pre>
                </div>
            `).join('')}
            ` : ''}

            ${examples.configuration && examples.configuration.length > 0 ? `
            <h3>Configuration Examples</h3>
            ${examples.configuration.map(config => `
                <div class="code">
                    <h4>${config.filename}</h4>
                    <pre><code>${config.content}</code></pre>
                </div>
            `).join('')}
            ` : ''}
        </section>
        ` : ''}

        <section id="structure">
            <h2>Plugin Structure</h2>
            <div class="grid">
                <div class="card">
                    <h3>Files</h3>
                    <ul class="list">
                        ${structure.files.slice(0, 10).map(file => `
                            <li>${file.path} <small>(${file.size} bytes)</small></li>
                        `).join('')}
                        ${structure.files.length > 10 ? `<li><em>... and ${structure.files.length - 10} more files</em></li>` : ''}
                    </ul>
                </div>
                
                <div class="card">
                    <h3>File Types</h3>
                    <ul class="list">
                        ${Object.entries(files.byType).map(([ext, count]) => `
                            <li>${ext || 'no extension'}: ${count} files</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </section>

        ${dependencies ? `
        <section id="dependencies">
            <h2>Dependencies</h2>
            
            ${Object.keys(dependencies.production).length > 0 ? `
            <h3>Production Dependencies</h3>
            <ul class="list">
                ${Object.entries(dependencies.production).map(([name, version]) => `
                    <li><code>${name}</code> ${version}</li>
                `).join('')}
            </ul>
            ` : ''}

            ${Object.keys(dependencies.development).length > 0 ? `
            <h3>Development Dependencies</h3>
            <ul class="list">
                ${Object.entries(dependencies.development).map(([name, version]) => `
                    <li><code>${name}</code> ${version}</li>
                `).join('')}
            </ul>
            ` : ''}

            ${Object.keys(dependencies.scripts).length > 0 ? `
            <h3>Available Scripts</h3>
            <ul class="list">
                ${Object.entries(dependencies.scripts).map(([name, command]) => `
                    <li><code>npm run ${name}</code> - ${command}</li>
                `).join('')}
            </ul>
            ` : ''}
        </section>
        ` : ''}

        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
            <p>Generated by CTRL-ALT-PLAY Plugin Documentation Generator</p>
        </footer>
    </div>
</body>
</html>`;
  }

  private async generateMarkdownDocs(docData: any, outputPath: string): Promise<void> {
    const { plugin, structure, api, examples, dependencies, files } = docData;
    
    let markdown = `# ${plugin.name}

${plugin.description || 'No description provided'}

## Plugin Information

- **Version**: ${plugin.version}
- **Author**: ${plugin.author}
- **Generated**: ${new Date().toLocaleDateString()}

## Installation

\`\`\`bash
# Install the plugin
plugin-cli install ./${plugin.name}

# Enable the plugin
plugin-cli enable ${plugin.name}

# Check status
plugin-cli list
\`\`\`

## Configuration

Plugin configuration is managed through the \`plugin.yaml\` file:

\`\`\`yaml
${JSON.stringify(plugin, null, 2)}
\`\`\`

`;

    if (plugin.permissions) {
      markdown += `## Permissions

| Permission | Status |
|------------|--------|
`;
      for (const [key, value] of Object.entries(plugin.permissions)) {
        markdown += `| ${key.charAt(0).toUpperCase() + key.slice(1)} | ${value ? '✅ Enabled' : '❌ Disabled'} |\n`;
      }
      markdown += '\n';
    }

    if (api) {
      markdown += `## API Reference

`;
      
      if (api.routes && api.routes.length > 0) {
        markdown += `### Routes

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
`;
        for (const route of api.routes) {
          markdown += `| ${route.method} | \`${route.path}\` | ${route.handler} | ${route.description || '-'} |\n`;
        }
        markdown += '\n';
      }

      if (api.methods && api.methods.length > 0) {
        markdown += `### Methods

`;
        for (const method of api.methods) {
          markdown += `- \`${method.signature}\`${method.async ? ' (async)' : ''}\n`;
        }
        markdown += '\n';
      }

      if (api.events && api.events.length > 0) {
        markdown += `### Events

`;
        for (const event of api.events) {
          markdown += `- \`${event.name}\` - ${event.type}\n`;
        }
        markdown += '\n';
      }
    }

    if (examples && examples.usage && examples.usage.length > 0) {
      markdown += `## Examples

`;
      for (let i = 0; i < examples.usage.length; i++) {
        const example = examples.usage[i];
        markdown += `### Example ${i + 1}

\`\`\`${example.language}
${example.code}
\`\`\`

`;
      }
    }

    markdown += `## Plugin Structure

- **Total Files**: ${files.total}
- **Has Tests**: ${structure.hasTests ? '✅' : '❌'}
- **Has Components**: ${structure.hasComponents ? '✅' : '❌'}

### File Types

`;
    for (const [ext, count] of Object.entries(files.byType)) {
      markdown += `- ${ext || 'no extension'}: ${count} files\n`;
    }

    if (dependencies) {
      markdown += `
## Dependencies

`;
      
      if (Object.keys(dependencies.production).length > 0) {
        markdown += `### Production Dependencies

`;
        for (const [name, version] of Object.entries(dependencies.production)) {
          markdown += `- \`${name}\` ${version}\n`;
        }
        markdown += '\n';
      }

      if (Object.keys(dependencies.development).length > 0) {
        markdown += `### Development Dependencies

`;
        for (const [name, version] of Object.entries(dependencies.development)) {
          markdown += `- \`${name}\` ${version}\n`;
        }
        markdown += '\n';
      }

      if (Object.keys(dependencies.scripts).length > 0) {
        markdown += `### Available Scripts

`;
        for (const [name, command] of Object.entries(dependencies.scripts)) {
          markdown += `- \`npm run ${name}\` - ${command}\n`;
        }
        markdown += '\n';
      }
    }

    markdown += `
---

*Generated by CTRL-ALT-PLAY Plugin Documentation Generator*
`;

    fs.writeFileSync(path.join(outputPath, 'README.md'), markdown);
  }

  private async generateJsonDocs(docData: any, outputPath: string): Promise<void> {
    const jsonDocs = {
      metadata: {
        generator: 'CTRL-ALT-PLAY Plugin Documentation Generator',
        generated: new Date().toISOString(),
        version: '1.0.0'
      },
      ...docData
    };

    fs.writeFileSync(
      path.join(outputPath, 'documentation.json'),
      JSON.stringify(jsonDocs, null, 2)
    );
  }

  private async copyDefaultAssets(outputPath: string): Promise<void> {
    // In a real implementation, you might copy CSS, JS, and other assets
    // For now, we'll just create a simple CSS file
    const cssContent = `/* Plugin Documentation Styles */
body { 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
  line-height: 1.6; 
  margin: 0; 
  padding: 20px; 
  background: #f5f5f5; 
}

.container { 
  max-width: 1200px; 
  margin: 0 auto; 
  background: white; 
  padding: 40px; 
  border-radius: 8px; 
  box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
}

/* Additional styles would be added here */
`;

    const assetsDir = path.join(outputPath, 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(assetsDir, 'style.css'), cssContent);
  }
}