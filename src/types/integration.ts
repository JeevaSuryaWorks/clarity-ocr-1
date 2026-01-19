export type IntegrationType = 'trello' | 'notion' | 'jira' | 'asana' | 'slack' | 'github' | 'clickup' | 'monday';

export interface IntegrationConfig {
  id: string; // unique id for this connection (e.g. 'trello-1')
  type: IntegrationType;
  name: string; // User friendly name e.g. "My Trello"
  isEnabled: boolean;
  credentials: {
    apiKey?: string;
    apiToken?: string;
    workspaceId?: string;
    // We store these locally or in a private user doc
  };
  metadata?: any;
  connectedAt: number;
}

export interface IntegrationProvider {
  id: IntegrationType;
  name: string;
  description: string;
  icon: any; // Lucide icon
  color: string;
  docsUrl?: string; // Link to guide on how to get API key
  requiredFields: {
    key: string;
    label: string;
    placeholder?: string;
    description?: string;
    type: 'text' | 'password';
  }[];
}

export interface IntegrationAdapter {
  getLists?: (config: IntegrationConfig) => Promise<{ id: string, name: string, group?: string }[]>;
  createTask: (config: IntegrationConfig, task: { title: string, content: string, url?: string }, context?: any) => Promise<string | null>;
}
