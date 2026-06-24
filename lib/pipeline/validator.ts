import type {
  GeneratedSchemas,
  IntentOutput,
  SystemDesign,
  ValidationIssue,
  ValidationReport,
} from "../../types/pipeline";

let issueCounter = 0;
const newIssueId = () => `issue_${++issueCounter}`;

export function validateSchemas(
  intent: IntentOutput,
  design: SystemDesign,
  schemas: GeneratedSchemas
): ValidationReport {
  issueCounter = 0;
  const issues: ValidationIssue[] = [];

  // ── UI Schema Validation ────────────────────────────────────────────────
  const { uiSchema, apiSchema, dbSchema, authSchema } = schemas;

  // Check pages exist
  if (!uiSchema.pages || uiSchema.pages.length === 0) {
    issues.push({
      id: newIssueId(),
      severity: "error",
      code: "UI_NO_PAGES",
      message: "UI schema has no pages defined",
      schema: "ui",
      suggestion: "Add at least a login page and a dashboard page",
    });
  }

  // Check components exist
  if (!uiSchema.components || uiSchema.components.length === 0) {
    issues.push({
      id: newIssueId(),
      severity: "warning",
      code: "UI_NO_COMPONENTS",
      message: "UI schema has no components defined",
      schema: "ui",
      suggestion: "Add Form and Table components for each entity",
    });
  }

  // Validate page components reference valid component names
  const componentNames = new Set(
    uiSchema.components?.map((c) => c.name) ?? []
  );
  for (const page of uiSchema.pages ?? []) {
    for (const compRef of page.components ?? []) {
      if (!componentNames.has(compRef)) {
        issues.push({
          id: newIssueId(),
          severity: "error",
          code: "UI_BROKEN_COMPONENT_REF",
          message: `Page "${page.name}" references unknown component "${compRef}"`,
          schema: "ui",
          field: compRef,
          suggestion: `Add a component named "${compRef}" or remove the reference`,
        });
      }
    }
  }

  // Validate component types
  const validTypes = [
    "Form",
    "Table",
    "Dashboard",
    "Card",
    "Input",
    "Button",
    "Modal",
    "Chart",
  ];
  for (const comp of uiSchema.components ?? []) {
    if (!validTypes.includes(comp.type)) {
      issues.push({
        id: newIssueId(),
        severity: "error",
        code: "UI_INVALID_COMPONENT_TYPE",
        message: `Component "${comp.name}" has invalid type "${comp.type}"`,
        schema: "ui",
        field: comp.name,
        suggestion: `Use one of: ${validTypes.join(", ")}`,
      });
    }
  }

  // ── API Schema Validation ───────────────────────────────────────────────

  if (!apiSchema.endpoints || apiSchema.endpoints.length === 0) {
    issues.push({
      id: newIssueId(),
      severity: "error",
      code: "API_NO_ENDPOINTS",
      message: "API schema has no endpoints defined",
      schema: "api",
      suggestion: "Add CRUD endpoints for each entity",
    });
  }

  const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  for (const endpoint of apiSchema.endpoints ?? []) {
    if (!validMethods.includes(endpoint.method)) {
      issues.push({
        id: newIssueId(),
        severity: "error",
        code: "API_INVALID_METHOD",
        message: `Endpoint "${endpoint.path}" has invalid method "${endpoint.method}"`,
        schema: "api",
        field: endpoint.path,
        suggestion: `Use one of: ${validMethods.join(", ")}`,
      });
    }

    if (!endpoint.path.startsWith("/")) {
      issues.push({
        id: newIssueId(),
        severity: "error",
        code: "API_INVALID_PATH",
        message: `Endpoint path "${endpoint.path}" must start with "/"`,
        schema: "api",
        field: endpoint.path,
        suggestion: `Prepend "/" to the path`,
      });
    }
  }

  // Check entity coverage in API
  const entityNames = new Set(intent.entities.map((e) => e.name));
  const apiEntities = new Set(
    apiSchema.endpoints?.map((e) => e.entity) ?? []
  );
  for (const entity of entityNames) {
    if (!apiEntities.has(entity)) {
      issues.push({
        id: newIssueId(),
        severity: "warning",
        code: "API_MISSING_ENTITY_ENDPOINTS",
        message: `No API endpoints found for entity "${entity}"`,
        schema: "api",
        field: entity,
        suggestion: `Add GET, POST, PUT, DELETE endpoints for ${entity}`,
      });
    }
  }

  // ── DB Schema Validation ────────────────────────────────────────────────

  if (!dbSchema.tables || dbSchema.tables.length === 0) {
    issues.push({
      id: newIssueId(),
      severity: "error",
      code: "DB_NO_TABLES",
      message: "Database schema has no tables defined",
      schema: "db",
      suggestion: "Generate tables for each entity",
    });
  }

  for (const table of dbSchema.tables ?? []) {
    const hasId = table.columns?.some((c) => c.name === "id");
    if (!hasId) {
      issues.push({
        id: newIssueId(),
        severity: "error",
        code: "DB_MISSING_ID",
        message: `Table "${table.name}" is missing a primary key "id" column`,
        schema: "db",
        field: table.name,
        suggestion: `Add an "id" column of type TEXT with unique=true`,
      });
    }

    const hasCreatedAt = table.columns?.some((c) => c.name === "createdAt");
    if (!hasCreatedAt) {
      issues.push({
        id: newIssueId(),
        severity: "warning",
        code: "DB_MISSING_TIMESTAMPS",
        message: `Table "${table.name}" is missing "createdAt" timestamp`,
        schema: "db",
        field: table.name,
        suggestion: `Add createdAt and updatedAt TIMESTAMP columns`,
      });
    }
  }

  // Check for relationship column mismatches
  for (const rel of design.relationships ?? []) {
    const toTableName = rel.to.toLowerCase();
    const fromTableName = rel.from.toLowerCase();
    const toTable = dbSchema.tables?.find(
      (t) =>
        t.name.toLowerCase() === toTableName ||
        t.name.toLowerCase() === toTableName + "s"
    );
    if (!toTable) {
      issues.push({
        id: newIssueId(),
        severity: "error",
        code: "DB_BROKEN_RELATIONSHIP",
        message: `Relationship "${rel.from} → ${rel.to}" references missing table "${rel.to}"`,
        schema: "db",
        field: `${fromTableName} → ${toTableName}`,
        suggestion: `Create a table for "${rel.to}" entity`,
      });
    }
  }

  // ── Auth Schema Validation ──────────────────────────────────────────────

  if (!authSchema.providers || authSchema.providers.length === 0) {
    issues.push({
      id: newIssueId(),
      severity: "error",
      code: "AUTH_NO_PROVIDERS",
      message: "Auth schema has no providers configured",
      schema: "auth",
      suggestion: "Add at least one auth provider (google, email, github)",
    });
  }

  if (!authSchema.roles || authSchema.roles.length === 0) {
    issues.push({
      id: newIssueId(),
      severity: "error",
      code: "AUTH_NO_ROLES",
      message: "Auth schema has no roles defined",
      schema: "auth",
      suggestion: 'Add at least ["admin", "user"] roles',
    });
  }

  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const info = issues.filter((i) => i.severity === "info").length;

  return {
    isValid: errors === 0,
    issues,
    summary: { errors, warnings, info },
    timestamp: new Date().toISOString(),
  };
}
