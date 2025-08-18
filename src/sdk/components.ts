/**
 * Plugin SDK React Components
 * Type definitions and component interfaces for plugin development
 * Note: This file contains React component interfaces. For implementation,
 * create .tsx files in your plugin project.
 */

import { ReactNode } from 'react';
import { PluginComponentProps, PluginConfig } from './types';

/**
 * Plugin Status Badge Component Props
 */
export interface PluginStatusBadgeProps {
  pluginName: string;
  showLastUpdate?: boolean;
}

/**
 * Plugin Configuration Form Component Props
 */
export interface PluginConfigFormProps {
  pluginName: string;
  onSave?: (config: PluginConfig) => void;
}

/**
 * Plugin Logs Viewer Component Props
 */
export interface PluginLogsViewerProps {
  pluginName: string;
  follow?: boolean;
  maxLines?: number;
}

/**
 * Plugin Metrics Dashboard Component Props
 */
export interface PluginMetricsDashboardProps {
  pluginName: string;
  timeRange?: string;
}

/**
 * Plugin File Manager Component Props
 */
export interface PluginFileManagerProps {
  pluginName: string;
  directory?: string;
  onFileSelect?: (file: any) => void;
}

/**
 * Plugin Development Tools Component Props
 */
export interface PluginDevToolsProps {
  pluginName: string;
}

/**
 * Plugin Card Component Props
 */
export interface PluginCardProps {
  plugin: PluginConfig;
  onInstall?: (plugin: PluginConfig) => void;
  onConfigure?: (plugin: PluginConfig) => void;
  showActions?: boolean;
}

/**
 * Plugin Dashboard Component Props
 */
export interface PluginDashboardProps {
  pluginName: string;
}

/**
 * Component Factory for creating plugin components
 */
export class PluginComponentFactory {
  /**
   * Create a plugin status badge component
   */
  static createStatusBadge(props: PluginStatusBadgeProps): ReactNode {
    // This would return the actual React component in a real implementation
    return null;
  }

  /**
   * Create a plugin configuration form component
   */
  static createConfigForm(props: PluginConfigFormProps): ReactNode {
    return null;
  }

  /**
   * Create a plugin logs viewer component
   */
  static createLogsViewer(props: PluginLogsViewerProps): ReactNode {
    return null;
  }

  /**
   * Create a plugin metrics dashboard component
   */
  static createMetricsDashboard(props: PluginMetricsDashboardProps): ReactNode {
    return null;
  }

  /**
   * Create a plugin file manager component
   */
  static createFileManager(props: PluginFileManagerProps): ReactNode {
    return null;
  }

  /**
   * Create plugin development tools component
   */
  static createDevTools(props: PluginDevToolsProps): ReactNode {
    return null;
  }

  /**
   * Create a plugin card component
   */
  static createPluginCard(props: PluginCardProps): ReactNode {
    return null;
  }

  /**
   * Create a complete plugin dashboard
   */
  static createPluginDashboard(props: PluginDashboardProps): ReactNode {
    return null;
  }
}

/**
 * Plugin Component Template Generator
 * Generates React component code for plugins
 */
export class PluginComponentGenerator {
  /**
   * Generate a basic React component template
   */
  static generateBasicComponent(componentName: string, props: any): string {
    return `import React, { useState, useEffect } from 'react';
import { usePluginApi } from '@ctrl-alt-play/plugin-sdk';

interface ${componentName}Props {
  pluginName: string;
  // Add your props here
}

export const ${componentName}: React.FC<${componentName}Props> = ({ pluginName }) => {
  const { data, loading, error } = usePluginApi(\`/api/\${pluginName}/data\`);
  const [state, setState] = useState({});

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">Error</h3>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{pluginName}</h2>
        <p className="text-gray-600">Component content goes here</p>
        
        {/* Add your component JSX here */}
      </div>
    </div>
  );
};

export default ${componentName};`;
  }

  /**
   * Generate a form component template
   */
  static generateFormComponent(componentName: string): string {
    return `import React, { useState, useEffect } from 'react';
import { usePluginConfig } from '@ctrl-alt-play/plugin-sdk';

interface ${componentName}Props {
  pluginName: string;
  onSave?: (config: any) => void;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ pluginName, onSave }) => {
  const { config, loading, updateConfig } = usePluginConfig(pluginName);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig(formData);
    onSave?.(formData);
  };

  if (loading) {
    return <div className="animate-pulse">Loading configuration...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Setting</label>
        <input
          type="text"
          value={formData.setting || ''}
          onChange={(e) => setFormData({ ...formData, setting: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
      >
        Save Configuration
      </button>
    </form>
  );
};

export default ${componentName};`;
  }

  /**
   * Generate a dashboard component template
   */
  static generateDashboardComponent(componentName: string): string {
    return `import React, { useState } from 'react';
import { 
  usePluginStatus, 
  usePluginLogs, 
  usePluginMetrics,
  PluginStatusBadge,
  PluginLogsViewer,
  PluginMetricsDashboard 
} from '@ctrl-alt-play/plugin-sdk';

interface ${componentName}Props {
  pluginName: string;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ pluginName }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'logs', label: 'Logs' },
    { id: 'metrics', label: 'Metrics' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{pluginName}</h2>
        <PluginStatusBadge pluginName={pluginName} showLastUpdate />
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={\`py-2 px-1 border-b-2 font-medium text-sm \${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }\`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && <PluginMetricsDashboard pluginName={pluginName} />}
        {activeTab === 'logs' && <PluginLogsViewer pluginName={pluginName} follow />}
        {activeTab === 'metrics' && <div>Metrics content</div>}
      </div>
    </div>
  );
};

export default ${componentName};`;
  }
}