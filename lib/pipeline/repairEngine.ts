import type {
  GeneratedSchemas,
  IntentOutput,
  RepairAction,
  RepairResult,
  ValidationIssue,
  ValidationReport,
} from "../../types/pipeline";
import { validateSchemas } from "./validator";

function cloneDeep<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

type Schemas = GeneratedSchemas;

function repairUIIssue(
  schemas: Schemas,
  issue: ValidationIssue
): RepairAction | null {
  const before = cloneDeep(schemas.uiSchema);

  switch (issue.code) {
    case "UI_NO_PAGES": {
      schemas.uiSchema.pages = [
        {
          name: "Login",
          path: "/login",
          auth: false,
          roles: [],
          components: [],
        },
        {
          name: "Dashboard",
          path: "/dashboard",
          auth: true,
          roles: ["admin", "user"],
          components: [],
        },
      ];
      return {
        issueId: issue.id,
        issueCode: issue.code,
        description: "Added default Login and Dashboard pages",
        schema: "ui",
        before,
        after: schemas.uiSchema,
        success: true,
      };
    }
    case "UI_NO_COMPONENTS": {
      schemas.uiSchema.components = [
        {
          name: "DashboardOverview",
          type: "Dashboard",
          props: { title: "Overview" },
        },
      ];
      return {
        issueId: issue.id,
        issueCode: issue.code,
        description: "Added default Dashboard component",
        schema: "ui",
        before,
        after: schemas.uiSchema,
        success: true,
      };
    }
    case "UI_BROKEN_COMPONENT_REF": {
      // Remove broken reference from all pages
      for (const page of schemas.uiSchema.pages ?? []) {
        page.components = (page.components ?? []).filter(
          (c) => c !== issue.field
        );
      }
      return {
        issueId: issue.id,
        issueCode: issue.code,
        description: `Removed broken component reference "${issue.field}" from pages`,
        schema: "ui",
        field: issue.field,
        before,
        after: schemas.uiSchema,
        success: true,
      };
    }
    case "UI_INVALID_COMPONENT_TYPE": {
      const comp = schemas.uiSchema.components?.find(
        (c) => c.name === issue.field
      );
      if (comp) {
        comp.type = "Card"; // fallback to safe type
      }
      return {
        issueId: issue.id,
        issueCode: issue.code,
        description: `Fixed invalid component type for "${issue.field}" → "Card"`,
        schema: "ui",
        field: issue.field,
        before,
        after: schemas.uiSchema,
        success: true,
      };
    }
    default:
      return null;
  }
}

function repairAPIIssue(
  schemas: Schemas,
  issue: ValidationIssue,
  intent: IntentOutput
): RepairAction | null {
  const before = cloneDeep(schemas.apiSchema);

  switch (issue.code) {
    case "API_NO_ENDPOINTS": {
      // Generate basic CRUD for each entity
      schemas.apiSchema.endpoints = intent.entities.flatMap((entity) => [
        {
          method: "GET" as const,
          path: `/api/v1/${entity.name.toLowerCase()}s`,
          entity: entity.name,
          auth: true,
          roles: ["admin", "user"],
          description: `List all ${entity.name}s`,
        },
        {
          method: "POST" as const,
          path: `/api/v1/${entity.name.toLowerCase()}s`,
          entity: entity.name,
          auth: true,
          roles: ["admin"],
          description: `Create ${entity.name}`,
        },
        {
          method: "PUT" as const,
          path: `/api/v1/${entity.name.toLowerCase()}s/:id`,
          entity: entity.name,
          auth: true,
          roles: ["admin"],
          description: `Update ${entity.name}`,
        },
        {
          method: "DELETE" as const,
          path: `/api/v1/${entity.name.toLowerCase()}s/:id`,
          entity: entity.name,
          auth: true,
          roles: ["admin"],
          description: `Delete ${entity.name}`,
        },
      ]);
      return {
        issueId: issue.id,
        issueCode: issue.code,
        description: `Generated CRUD endpoints for ${intent.entities.length} entities`,
        schema: "api",
        before,
        after: schemas.apiSchema,
        success: true,
      };
    }
    case "API_INVALID_METHOD": {
      const endpoint = schemas.apiSchema.endpoints?.find(
        (e) => e.path === issue.field
      );
      if (endpoint) {
        endpoint.method = "GET";
      }
      return {
        issueId: issue.id,
        issueCode: issue.code,
        description: `Fixed invalid HTTP method on "${issue.field}" → "GET"`,
        schema: "api",
        field: issue.field,
        before,
        after: schemas.apiSchema,
        success: true,
      };
    }
    case "API_INVALID_PATH": {
      const endpoint = schemas.apiSchema.endpoints?.find(
        (e) => e.path === issue.field
      );
      if (endpoint && !endpoint.path.startsWith("/")) {
        endpoint.path = "/" + endpoint.path;
      }
      return {
        issueId: issue.id,
        issueCode: issue.code,
        description: `Fixed path "${issue.field}" to start with "/"`,
        schema: "api",
        field: issue.field,
        before,
        after: schemas.apiSchema,
        success: true,
      };
    }
    case "API_MISSING_ENTITY_ENDPOINTS": {
      if (issue.field) {
        const entity = issue.field;
        schemas.apiSchema.endpoints?.push(
          {
            method: "GET" as const,
            path: `/api/v1/${entity.toLowerCase()}s`,
            entity,
            auth: true,
            roles: ["admin", "user"],
            description: `List all ${entity}s`,
          },
          {
            method: "POST" as const,
            path: `/api/v1/${entity.toLowerCase()}s`,
            entity,
            auth: true,
            roles: ["admin"],
            description: `Create ${entity}`,
          }
        );
      }
      return {
        issueId: issue.id,
        issueCode: issue.code,
        description: `Added missing endpoints for entity "${issue.field}"`,
        schema: "api",
        field: issue.field,
        before,
        after: schemas.apiSchema,
        success: true,
      };
    }
    default:
      return null;
  }
}

function repairDBIssue(
  schemas: Schemas,
  issue: ValidationIssue,
  intent: IntentOutput
): RepairAction | null {
  const before = cloneDeep(schemas.dbSchema);

  switch (issue.code) {
    case "DB_NO_TABLES": {
      schemas.dbSchema.tables = intent.entities.map((entity) => ({
        name: entity.name.toLowerCase() + "s",
        columns: [
          { name: "id", type: "TEXT", nullable: false, unique: true, default: "cuid()" },
          { name: "created_at", type: "TIMESTAMP", nullable: false, default: "now()" },
          { name: "updated_at", type: "TIMESTAMP", nullable: false, default: "now()" },
          ...entity.fields
            .filter((f) => !["id", "createdAt", "updatedAt"].includes(f.name))
            .map((f) => ({
              name: f.name,
              type: f.type.toUpperCase() === "STRING" ? "TEXT" : f.type.toUpperCase(),
              nullable: !f.required,
              unique: f.unique ?? false,
            })),
        ],
      }));
      return {
        issueId: issue.id,
        issueCode: issue.code,
        description: `Generated ${schemas.dbSchema.tables.length} tables from entities`,
        schema: "db",
        before,
        after: schemas.dbSchema,
        success: true,
      };
    }
    case "DB_MISSING_ID": {
      const table = schemas.dbSchema.tables?.find(
        (t) => t.name === issue.field
      );
      if (table) {
        table.columns = [
          { name: "id", type: "TEXT", nullable: false, unique: true, default: "cuid()" },
          ...table.columns,
        ];
      }
      return {
        issueId: issue.id,
        issueCode: issue.code,
        description: `Added "id" primary key column to table "${issue.field}"`,
        schema: "db",
        field: issue.field,
        before,
        after: schemas.dbSchema,
        success: true,
      };
    }
    case "DB_MISSING_TIMESTAMPS": {
      const table = schemas.dbSchema.tables?.find(
        (t) => t.name === issue.field
      );
      if (table) {
        table.columns.push(
          { name: "created_at", type: "TIMESTAMP", nullable: false, default: "now()" },
          { name: "updated_at", type: "TIMESTAMP", nullable: false, default: "now()" }
        );
      }
      return {
        issueId: issue.id,
        issueCode: issue.code,
        description: `Added timestamp columns to table "${issue.field}"`,
        schema: "db",
        field: issue.field,
        before,
        after: schemas.dbSchema,
        success: true,
      };
    }
    case "DB_BROKEN_RELATIONSHIP": {
      // Add the missing table with basic structure
      const parts = issue.field?.split(" → ");
      const missingEntity = parts?.[1];
      if (missingEntity) {
        schemas.dbSchema.tables?.push({
          name: missingEntity.toLowerCase() + "s",
          columns: [
            { name: "id", type: "TEXT", nullable: false, unique: true, default: "cuid()" },
            { name: "created_at", type: "TIMESTAMP", nullable: false, default: "now()" },
            { name: "updated_at", type: "TIMESTAMP", nullable: false, default: "now()" },
          ],
        });
      }
      return {
        issueId: issue.id,
        issueCode: issue.code,
        description: `Created missing table "${missingEntity}" to fix broken relationship`,
        schema: "db",
        field: issue.field,
        before,
        after: schemas.dbSchema,
        success: true,
      };
    }
    default:
      return null;
  }
}

function repairAuthIssue(
  schemas: Schemas,
  issue: ValidationIssue
): RepairAction | null {
  const before = cloneDeep(schemas.authSchema);

  switch (issue.code) {
    case "AUTH_NO_PROVIDERS": {
      schemas.authSchema.providers = ["google", "email"];
      return {
        issueId: issue.id,
        issueCode: issue.code,
        description: 'Added default auth providers: ["google", "email"]',
        schema: "auth",
        before,
        after: schemas.authSchema,
        success: true,
      };
    }
    case "AUTH_NO_ROLES": {
      schemas.authSchema.roles = ["admin", "user", "guest"];
      return {
        issueId: issue.id,
        issueCode: issue.code,
        description: 'Added default roles: ["admin", "user", "guest"]',
        schema: "auth",
        before,
        after: schemas.authSchema,
        success: true,
      };
    }
    default:
      return null;
  }
}

export async function repairSchemas(
  schemas: GeneratedSchemas,
  validationReport: ValidationReport,
  intent: IntentOutput
): Promise<RepairResult> {
  const repairedSchemas = cloneDeep(schemas);
  const repairs: RepairAction[] = [];
  const unrepairedIssues: ValidationIssue[] = [];

  // Process errors first, then warnings
  const sortedIssues = [...validationReport.issues].sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  for (const issue of sortedIssues) {
    let repairAction: RepairAction | null = null;

    if (issue.schema === "ui") {
      repairAction = repairUIIssue(repairedSchemas, issue);
    } else if (issue.schema === "api") {
      repairAction = repairAPIIssue(repairedSchemas, issue, intent);
    } else if (issue.schema === "db") {
      repairAction = repairDBIssue(repairedSchemas, issue, intent);
    } else if (issue.schema === "auth") {
      repairAction = repairAuthIssue(repairedSchemas, issue);
    }

    if (repairAction) {
      repairs.push(repairAction);
    } else {
      unrepairedIssues.push(issue);
    }
  }

  // Re-validate after repairs
  const postRepairValidation = validateSchemas(
    intent,
    { entities: [], relationships: [], workflows: [], permissions: [] },
    repairedSchemas
  );

  const remainingErrors = postRepairValidation.issues.filter(
    (i) => i.severity === "error"
  );

  return {
    success: remainingErrors.length === 0,
    repairedSchemas,
    repairs,
    remainingIssues: unrepairedIssues,
    timestamp: new Date().toISOString(),
  };
}
