// ─── Pipeline Types ─────────────────────────────────────────────────────────

export interface IntentOutput {
  appType: string;
  entities: Entity[];
  roles: string[];
  features: Feature[];
  description?: string;
  requiresClarification?: boolean;
  clarificationReason?: string;
}

export interface Entity {
  name: string;
  fields: EntityField[];
  description?: string;
}

export interface EntityField {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  description?: string;
}

export interface Feature {
  name: string;
  description: string;
  entities?: string[];
  roles?: string[];
}

// ─── System Design Types ─────────────────────────────────────────────────────

export interface SystemDesign {
  entities: DesignEntity[];
  relationships: Relationship[];
  workflows: Workflow[];
  permissions: Permission[];
}

export interface DesignEntity {
  name: string;
  fields: EntityField[];
  indexes?: string[];
  description?: string;
}

export interface Relationship {
  from: string;
  to: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
  field: string;
  description?: string;
}

export interface Workflow {
  name: string;
  steps: WorkflowStep[];
  roles: string[];
  description?: string;
}

export interface WorkflowStep {
  order: number;
  action: string;
  actor: string;
  entity?: string;
}

export interface Permission {
  role: string;
  resource: string;
  actions: ("create" | "read" | "update" | "delete")[];
}

// ─── Schema Types ─────────────────────────────────────────────────────────────

export interface GeneratedSchemas {
  uiSchema: UISchema;
  apiSchema: APISchema;
  dbSchema: DBSchema;
  authSchema: AuthSchema;
}

export interface UISchema {
  pages: UIPage[];
  components: UIComponent[];
  theme?: UITheme;
}

export interface UIPage {
  name: string;
  path: string;
  components: string[];
  auth: boolean;
  roles?: string[];
}

export interface UIComponent {
  name: string;
  type: "Form" | "Table" | "Dashboard" | "Card" | "Input" | "Button" | "Modal" | "Chart";
  props: Record<string, unknown>;
  entity?: string;
  fields?: string[];
}

export interface UITheme {
  primaryColor: string;
  mode: "light" | "dark" | "system";
}

export interface APISchema {
  endpoints: APIEndpoint[];
  middleware: string[];
  version: string;
}

export interface APIEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  entity: string;
  auth: boolean;
  roles?: string[];
  description: string;
}

export interface DBSchema {
  tables: DBTable[];
  enums?: DBEnum[];
}

export interface DBTable {
  name: string;
  columns: DBColumn[];
  indexes?: string[];
}

export interface DBColumn {
  name: string;
  type: string;
  nullable: boolean;
  unique?: boolean;
  default?: string;
  references?: string;
}

export interface DBEnum {
  name: string;
  values: string[];
}

export interface AuthSchema {
  providers: string[];
  roles: string[];
  strategy: string;
  sessionType: "jwt" | "database";
  protectedRoutes: string[];
}

// ─── Validation Types ─────────────────────────────────────────────────────────

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  code: string;
  message: string;
  schema: "ui" | "api" | "db" | "auth" | "system";
  field?: string;
  suggestion?: string;
}

export interface ValidationReport {
  isValid: boolean;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
  timestamp: string;
}

// ─── Repair Types ─────────────────────────────────────────────────────────────

export interface RepairAction {
  issueId: string;
  issueCode: string;
  description: string;
  schema: string;
  field?: string;
  before: unknown;
  after: unknown;
  success: boolean;
}

export interface RepairResult {
  success: boolean;
  repairedSchemas: GeneratedSchemas;
  repairs: RepairAction[];
  remainingIssues: ValidationIssue[];
  timestamp: string;
}

// ─── Pipeline Result ──────────────────────────────────────────────────────────

export type PipelineStage =
  | "intent"
  | "design"
  | "schema"
  | "validation"
  | "repair"
  | "preview";

export interface StageResult<T = unknown> {
  stage: PipelineStage;
  success: boolean;
  data?: T;
  error?: string;
  latencyMs: number;
}

export interface PipelineResult {
  projectId: string;
  success: boolean;
  stages: StageResult[];
  intent: IntentOutput;
  systemDesign: SystemDesign;
  schemas: GeneratedSchemas;
  validationReport: ValidationReport;
  repairResult?: RepairResult;
  totalLatencyMs: number;
  timestamp: string;
}

// ─── Preview Types ────────────────────────────────────────────────────────────

export interface PreviewComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: PreviewComponent[];
}

export interface PreviewSchema {
  components: PreviewComponent[];
  layout: "grid" | "stack" | "flex";
}
