export type RuntimeScalarType =
  | "string"
  | "text"
  | "email"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "json";

export type RuntimeComponentType =
  | "Form"
  | "Table"
  | "Dashboard"
  | "Card"
  | "Input"
  | "Button"
  | "Modal"
  | "Chart"
  | string;

export interface RuntimeFieldDefinition {
  name: string;
  label: string;
  type: RuntimeScalarType;
  required: boolean;
  unique?: boolean;
  description?: string;
}

export interface RuntimeEntityDefinition {
  name: string;
  label: string;
  pluralLabel: string;
  fields: RuntimeFieldDefinition[];
}

export interface RuntimeComponentDefinition {
  name: string;
  type: RuntimeComponentType;
  entity?: string;
  fields?: string[];
  props: Record<string, unknown>;
}

export interface RuntimePageDefinition {
  name: string;
  path: string;
  auth: boolean;
  roles: string[];
  components: string[];
}

export interface RuntimeWorkflowDefinition {
  name: string;
  description?: string;
  roles: string[];
  steps: Array<{
    order: number;
    action: string;
    actor: string;
    entity?: string;
  }>;
}

export interface RuntimeConfig {
  projectId: string;
  projectName: string;
  appType: string;
  entities: RuntimeEntityDefinition[];
  pages: RuntimePageDefinition[];
  components: RuntimeComponentDefinition[];
  workflows: RuntimeWorkflowDefinition[];
  roles: string[];
  locale: string;
}

export interface RuntimeRecord {
  id: string;
  entityName: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RuntimeNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface WorkflowRunSummary {
  id: string;
  workflowName: string;
  entityName?: string | null;
  action: string;
  status: string;
  summary: string;
  createdAt: string;
}

export interface CsvImportSummary {
  id: string;
  entityName: string;
  fileName: string;
  status: string;
  rowCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  errors?: Array<{ row: number; message: string }> | null;
}
