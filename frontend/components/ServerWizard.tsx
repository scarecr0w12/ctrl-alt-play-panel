import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  CloudIcon,
  CogIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { serversApi } from '@/lib/api';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface Node {
  id: string;
  uuid: string;
  name: string;
  description: string;
  memory: number;
  disk: number;
  agentOnline: boolean;
  location?: {
    id: string;
    name: string;
    description: string;
  };
}

interface Template {
  id: string;
  name: string;
  description: string;
  dockerImages?: Record<string, string>;
  startup: string;
  ctrl: {
    id: string;
    name: string;
    description: string;
  };
  variables: Array<{
    id: string;
    name: string;
    description: string;
    envVariable: string;
    defaultValue: string;
    userViewable: boolean;
    userEditable: boolean;
    rules?: string;
  }>;
}

interface Category {
  id: string;
  name: string;
  description: string;
  _count: {
    alts: number;
  };
}

interface ServerWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onServerCreated?: (server: any) => void;
}

const steps: WizardStep[] = [
  {
    id: 'category',
    title: 'Select Category',
    description: 'Choose the type of game server you want to create',
    completed: false,
  },
  {
    id: 'template',
    title: 'Choose Template',
    description: 'Pick a server template with predefined configurations',
    completed: false,
  },
  {
    id: 'node',
    title: 'Select Node',
    description: 'Choose which server node will host your game server',
    completed: false,
  },
  {
    id: 'config',
    title: 'Configure Server',
    description: 'Set server name, resources, and environment variables',
    completed: false,
  },
  {
    id: 'review',
    title: 'Review & Create',
    description: 'Review your configuration and create the server',
    completed: false,
  },
];

export default function ServerWizard({ isOpen, onClose, onServerCreated }: ServerWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);

  // Form data
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [serverConfig, setServerConfig] = useState({
    name: '',
    description: '',
    memory: 1024,
    disk: 5120,
    cpu: 100,
    swap: 0,
    io: 500,
    environment: {} as Record<string, string>,
    skipScripts: false,
  });

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadNodes();
    }
  }, [isOpen]);

  // Load templates when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadTemplates(selectedCategory.id);
    }
  }, [selectedCategory]);

  // Initialize environment variables when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const environment: Record<string, string> = {};
      selectedTemplate.variables.forEach(variable => {
        if (variable.userEditable) {
          environment[variable.envVariable] = variable.defaultValue;
        }
      });
      setServerConfig(prev => ({ ...prev, environment }));
    }
  }, [selectedTemplate]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await serversApi.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      setError('Failed to load server categories');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async (categoryId: string) => {
    try {
      setLoading(true);
      const response = await serversApi.getTemplates(categoryId);
      setTemplates(response.data.data);
    } catch (error) {
      setError('Failed to load server templates');
    } finally {
      setLoading(false);
    }
  };

  const loadNodes = async () => {
    try {
      setLoading(true);
      const response = await serversApi.getNodes();
      setNodes(response.data.data);
    } catch (error) {
      setError('Failed to load available nodes');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedCategory !== null;
      case 1: return selectedTemplate !== null;
      case 2: return selectedNode !== null;
      case 3: return serverConfig.name.trim() !== '';
      case 4: return true;
      default: return false;
    }
  };

  const createServer = async () => {
    if (!selectedNode || !selectedTemplate) return;

    try {
      setLoading(true);
      setError(null);

      const response = await serversApi.create({
        name: serverConfig.name,
        description: serverConfig.description,
        nodeId: selectedNode.id,
        altId: selectedTemplate.id,
        memory: serverConfig.memory,
        disk: serverConfig.disk,
        cpu: serverConfig.cpu,
        swap: serverConfig.swap,
        io: serverConfig.io,
        environment: serverConfig.environment,
        skipScripts: serverConfig.skipScripts,
      });

      if (onServerCreated) {
        onServerCreated(response.data.data);
      }

      onClose();
      router.push('/servers');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create server');
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setSelectedCategory(null);
    setSelectedTemplate(null);
    setSelectedNode(null);
    setServerConfig({
      name: '',
      description: '',
      memory: 1024,
      disk: 5120,
      cpu: 100,
      swap: 0,
      io: 500,
      environment: {},
      skipScripts: false,
    });
    setError(null);
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
        
        {/* Modal */}
        <div className="relative w-full max-w-4xl bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-white">Create New Server</h2>
              <p className="text-gray-400 mt-1">
                Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Progress */}
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors
                    ${index < currentStep ? 'bg-green-600 border-green-600' : 
                      index === currentStep ? 'border-blue-500 bg-blue-500' : 
                      'border-gray-600 bg-gray-800'}
                  `}>
                    {index < currentStep ? (
                      <CheckIcon className="h-4 w-4 text-white" />
                    ) : (
                      <span className="text-sm text-white">{index + 1}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-12 h-0.5 mx-2 transition-colors
                      ${index < currentStep ? 'bg-green-600' : 'bg-gray-600'}
                    `} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 min-h-[400px]">
            {error && (
              <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-200">{error}</span>
              </div>
            )}

            {/* Step 1: Category Selection */}
            {currentStep === 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Select Server Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category)}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${selectedCategory?.id === category.id
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }
                      `}
                    >
                      <div className="flex items-center mb-2">
                        <ServerIcon className="h-6 w-6 text-blue-400 mr-2" />
                        <h4 className="font-medium text-white">{category.name}</h4>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{category.description}</p>
                      <p className="text-gray-500 text-xs">
                        {category._count.alts} template{category._count.alts !== 1 ? 's' : ''} available
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Template Selection */}
            {currentStep === 1 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Choose Server Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }
                      `}
                    >
                      <div className="flex items-center mb-2">
                        <CogIcon className="h-6 w-6 text-green-400 mr-2" />
                        <h4 className="font-medium text-white">{template.name}</h4>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{template.description}</p>
                      <p className="text-gray-500 text-xs">
                        {template.variables.length} environment variable{template.variables.length !== 1 ? 's' : ''}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Node Selection */}
            {currentStep === 2 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Select Server Node</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => node.agentOnline && setSelectedNode(node)}
                      disabled={!node.agentOnline}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${!node.agentOnline
                          ? 'border-gray-700 bg-gray-800/30 opacity-50 cursor-not-allowed'
                          : selectedNode?.id === node.id
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <CloudIcon className="h-6 w-6 text-purple-400 mr-2" />
                          <h4 className="font-medium text-white">{node.name}</h4>
                        </div>
                        <div className={`
                          w-3 h-3 rounded-full
                          ${node.agentOnline ? 'bg-green-400' : 'bg-red-400'}
                        `} />
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{node.description}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <CpuChipIcon className="h-4 w-4 mr-1" />
                        <span>{Math.floor(node.memory / 1024)}GB RAM</span>
                        <CircleStackIcon className="h-4 w-4 ml-3 mr-1" />
                        <span>{Math.floor(node.disk / 1024)}GB Storage</span>
                      </div>
                      {node.location && (
                        <p className="text-xs text-gray-500 mt-1">{node.location.name}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Server Configuration */}
            {currentStep === 3 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Configure Server</h3>
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Server Name *
                      </label>
                      <input
                        type="text"
                        value={serverConfig.name}
                        onChange={(e) => setServerConfig(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                        placeholder="My Game Server"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={serverConfig.description}
                        onChange={(e) => setServerConfig(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                        placeholder="Server description"
                      />
                    </div>
                  </div>

                  {/* Resource Limits */}
                  <div>
                    <h4 className="text-md font-medium text-white mb-3">Resource Limits</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Memory (MB)
                        </label>
                        <input
                          type="number"
                          value={serverConfig.memory}
                          onChange={(e) => setServerConfig(prev => ({ ...prev, memory: parseInt(e.target.value) || 1024 }))}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                          min="512"
                          max="16384"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Disk (MB)
                        </label>
                        <input
                          type="number"
                          value={serverConfig.disk}
                          onChange={(e) => setServerConfig(prev => ({ ...prev, disk: parseInt(e.target.value) || 5120 }))}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                          min="1024"
                          max="102400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          CPU (%)
                        </label>
                        <input
                          type="number"
                          value={serverConfig.cpu}
                          onChange={(e) => setServerConfig(prev => ({ ...prev, cpu: parseInt(e.target.value) || 100 }))}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                          min="50"
                          max="400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Swap (MB)
                        </label>
                        <input
                          type="number"
                          value={serverConfig.swap}
                          onChange={(e) => setServerConfig(prev => ({ ...prev, swap: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                          min="0"
                          max="4096"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Environment Variables */}
                  {selectedTemplate && selectedTemplate.variables.filter(v => v.userEditable).length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-white mb-3">Environment Variables</h4>
                      <div className="space-y-3">
                        {selectedTemplate.variables
                          .filter(variable => variable.userEditable)
                          .map((variable) => (
                            <div key={variable.id}>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                {variable.name}
                                {variable.description && (
                                  <span className="text-gray-400 text-xs ml-2">
                                    - {variable.description}
                                  </span>
                                )}
                              </label>
                              <input
                                type="text"
                                value={serverConfig.environment[variable.envVariable] || ''}
                                onChange={(e) => setServerConfig(prev => ({
                                  ...prev,
                                  environment: {
                                    ...prev.environment,
                                    [variable.envVariable]: e.target.value
                                  }
                                }))}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                                placeholder={variable.defaultValue}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  <div>
                    <h4 className="text-md font-medium text-white mb-3">Options</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={serverConfig.skipScripts}
                        onChange={(e) => setServerConfig(prev => ({ ...prev, skipScripts: e.target.checked }))}
                        className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-300">Skip installation scripts</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 4 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Review Configuration</h3>
                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">Server Details</h4>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="text-gray-400">Name:</dt>
                      <dd className="text-white">{serverConfig.name}</dd>
                      <dt className="text-gray-400">Description:</dt>
                      <dd className="text-white">{serverConfig.description || 'None'}</dd>
                      <dt className="text-gray-400">Category:</dt>
                      <dd className="text-white">{selectedCategory?.name}</dd>
                      <dt className="text-gray-400">Template:</dt>
                      <dd className="text-white">{selectedTemplate?.name}</dd>
                      <dt className="text-gray-400">Node:</dt>
                      <dd className="text-white">{selectedNode?.name}</dd>
                    </dl>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">Resource Allocation</h4>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="text-gray-400">Memory:</dt>
                      <dd className="text-white">{serverConfig.memory} MB</dd>
                      <dt className="text-gray-400">Disk:</dt>
                      <dd className="text-white">{serverConfig.disk} MB</dd>
                      <dt className="text-gray-400">CPU:</dt>
                      <dd className="text-white">{serverConfig.cpu}%</dd>
                      <dt className="text-gray-400">Swap:</dt>
                      <dd className="text-white">{serverConfig.swap} MB</dd>
                    </dl>
                  </div>

                  {Object.keys(serverConfig.environment).length > 0 && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Environment Variables</h4>
                      <dl className="grid grid-cols-1 gap-2 text-sm">
                        {Object.entries(serverConfig.environment).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-2 gap-2">
                            <dt className="text-gray-400">{key}:</dt>
                            <dd className="text-white break-all">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-700">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              
              {currentStep === steps.length - 1 ? (
                <button
                  onClick={createServer}
                  disabled={loading || !canProceed()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Create Server
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}