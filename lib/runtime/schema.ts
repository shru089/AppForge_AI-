import type { GeneratedSchema } from "@prisma/client";
import type {
  RuntimeComponentDefinition,
  RuntimeConfig,
  RuntimeEntityDefinition,
  RuntimeFieldDefinition,
  RuntimeRecord,
  RuntimeScalarType,
} from "@/types/runtime";

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function toPluralLabel(value: string): string {
  return value.endsWith("s") ? value : `${value}s`;
}

function mapFieldType(value: unknown): RuntimeScalarType {
  const normalized = String(value ?? "string").toLowerCase();

  if (["int", "integer", "float", "number", "decimal"].includes(normalized)) {
    return "number";
  }
  if (["bool", "boolean"].includes(normalized)) {
    return "boolean";
  }
  if (["date"].includes(normalized)) {
    return "date";
  }
  if (["datetime", "timestamp"].includes(normalized)) {
    return "datetime";
  }
  if (["json"].includes(normalized)) {
    return "json";
  }
  if (["email"].includes(normalized)) {
    return "email";
  }
  if (["text"].includes(normalized)) {
    return "text";
  }

  return "string";
}

function normalizeField(rawField: unknown): RuntimeFieldDefinition | null {
  const field = asObject(rawField);
  const name = String(field.name ?? "").trim();

  if (!name) return null;

  return {
    name,
    label: toLabel(name),
    type: mapFieldType(field.type),
    required: Boolean(field.required),
    unique: Boolean(field.unique),
    description:
      typeof field.description === "string" ? field.description : undefined,
  };
}

function ensureSystemFields(fields: RuntimeFieldDefinition[]) {
  const existing = new Set(fields.map((field) => field.name));

  if (!existing.has("id")) {
    fields.unshift({
      name: "id",
      label: "ID",
      type: "string",
      required: true,
      unique: true,
    });
  }

  if (!existing.has("createdAt")) {
    fields.push({
      name: "createdAt",
      label: "Created At",
      type: "datetime",
      required: false,
    });
  }

  if (!existing.has("updatedAt")) {
    fields.push({
      name: "updatedAt",
      label: "Updated At",
      type: "datetime",
      required: false,
    });
  }
}

function normalizeEntities(generatedSchema: GeneratedSchema): RuntimeEntityDefinition[] {
  const systemDesign = asObject(generatedSchema.systemDesign);
  const intent = asObject(generatedSchema.intentJson);

  const designEntities = asArray<unknown>(systemDesign.entities);
  const intentEntities = asArray<unknown>(intent.entities);
  const sourceEntities = designEntities.length > 0 ? designEntities : intentEntities;

  return sourceEntities
    .map((rawEntity) => {
      const entity = asObject(rawEntity);
      const name = String(entity.name ?? "").trim();
      if (!name) return null;

      const fields = asArray<unknown>(entity.fields)
        .map(normalizeField)
        .filter((field): field is RuntimeFieldDefinition => Boolean(field));

      ensureSystemFields(fields);

      return {
        name,
        label: toLabel(name),
        pluralLabel: toPluralLabel(toLabel(name)),
        fields,
      };
    })
    .filter((entity): entity is RuntimeEntityDefinition => Boolean(entity));
}

function normalizeComponents(generatedSchema: GeneratedSchema): RuntimeComponentDefinition[] {
  const uiSchema = asObject(generatedSchema.uiSchema);
  const components = asArray<unknown>(uiSchema.components);

  return components
    .map((rawComponent, index) => {
      const component = asObject(rawComponent);
      const name = String(component.name ?? `Component ${index + 1}`).trim();
      const type = String(component.type ?? "Card").trim() || "Card";
      const entity = component.entity ? String(component.entity) : undefined;
      const fields = asArray<string>(component.fields).filter(Boolean);
      const props = asObject(component.props);

      return {
        name,
        type,
        entity,
        fields,
        props,
      };
    })
    .filter(Boolean);
}

function normalizePages(generatedSchema: GeneratedSchema, entities: RuntimeEntityDefinition[]) {
  const uiSchema = asObject(generatedSchema.uiSchema);
  const pages = asArray<unknown>(uiSchema.pages);

  if (pages.length > 0) {
    return pages.map((rawPage, index) => {
      const page = asObject(rawPage);
      return {
        name: String(page.name ?? `Page ${index + 1}`),
        path: String(page.path ?? `/page-${index + 1}`),
        auth: page.auth !== false,
        roles: asArray<string>(page.roles).filter(Boolean),
        components: asArray<string>(page.components).filter(Boolean),
      };
    });
  }

  const fallbackComponents = ["OverviewDashboard"];
  return [
    {
      name: "Dashboard",
      path: "/dashboard",
      auth: true,
      roles: ["admin", "user"],
      components: fallbackComponents,
    },
    ...entities.map((entity) => ({
      name: entity.pluralLabel,
      path: `/${entity.name.toLowerCase()}`,
      auth: true,
      roles: ["admin", "user"],
      components: [`${entity.name}Table`, `${entity.name}Form`],
    })),
  ];
}

function normalizeWorkflows(generatedSchema: GeneratedSchema): RuntimeConfig["workflows"] {
  const systemDesign = asObject(generatedSchema.systemDesign);
  return asArray<unknown>(systemDesign.workflows).map((rawWorkflow, index) => {
    const workflow = asObject(rawWorkflow);
    return {
      name: String(workflow.name ?? `Workflow ${index + 1}`),
      description:
        typeof workflow.description === "string" ? workflow.description : undefined,
      roles: asArray<string>(workflow.roles).filter(Boolean),
      steps: asArray<unknown>(workflow.steps).map((rawStep, stepIndex) => {
        const step = asObject(rawStep);
        return {
          order: Number(step.order ?? stepIndex + 1),
          action: String(step.action ?? "Process record"),
          actor: String(step.actor ?? "system"),
          entity: step.entity ? String(step.entity) : undefined,
        };
      }),
    };
  });
}

function normalizeRoles(generatedSchema: GeneratedSchema): string[] {
  const intent = asObject(generatedSchema.intentJson);
  const authSchema = asObject(generatedSchema.authSchema);

  const roles = [
    ...asArray<string>(intent.roles).filter(Boolean),
    ...asArray<string>(authSchema.roles).filter(Boolean),
  ];

  return Array.from(new Set(roles.length > 0 ? roles : ["admin", "user"]));
}

export function buildRuntimeConfig(params: {
  projectId: string;
  projectName: string;
  generatedSchema: GeneratedSchema;
}): RuntimeConfig {
  const entities = normalizeEntities(params.generatedSchema);
  const components = normalizeComponents(params.generatedSchema);

  if (!components.some((component) => component.name === "OverviewDashboard")) {
    components.unshift({
      name: "OverviewDashboard",
      type: "Dashboard",
      props: { title: "Overview" },
    });
  }

  for (const entity of entities) {
    if (!components.some((component) => component.name === `${entity.name}Table`)) {
      components.push({
        name: `${entity.name}Table`,
        type: "Table",
        entity: entity.name,
        fields: entity.fields.map((field) => field.name),
        props: { title: entity.pluralLabel },
      });
    }
    if (!components.some((component) => component.name === `${entity.name}Form`)) {
      components.push({
        name: `${entity.name}Form`,
        type: "Form",
        entity: entity.name,
        fields: entity.fields
          .filter((field) => !["id", "createdAt", "updatedAt"].includes(field.name))
          .map((field) => field.name),
        props: { title: `Create ${entity.label}` },
      });
    }
  }

  return {
    projectId: params.projectId,
    projectName: params.projectName,
    appType: String(asObject(params.generatedSchema.intentJson).appType ?? "web-app"),
    entities,
    pages: normalizePages(params.generatedSchema, entities),
    components,
    workflows: normalizeWorkflows(params.generatedSchema),
    roles: normalizeRoles(params.generatedSchema),
    locale: "en",
  };
}

function parseDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function coerceFieldValue(
  field: RuntimeFieldDefinition,
  value: unknown
): unknown {
  if (value === "" || value === undefined) return null;

  switch (field.type) {
    case "number": {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    }
    case "boolean": {
      if (typeof value === "boolean") return value;
      const normalized = String(value).toLowerCase();
      if (["true", "1", "yes", "on"].includes(normalized)) return true;
      if (["false", "0", "no", "off"].includes(normalized)) return false;
      return Boolean(value);
    }
    case "date":
    case "datetime":
      return parseDate(value) ?? value;
    case "json": {
      if (typeof value !== "string") return value;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    default:
      return value;
  }
}

export function validateRecordInput(params: {
  entity: RuntimeEntityDefinition;
  payload: Record<string, unknown>;
  partial?: boolean;
}) {
  const errors: string[] = [];
  const data: Record<string, unknown> = {};

  for (const field of params.entity.fields) {
    if (["id", "createdAt", "updatedAt"].includes(field.name)) continue;

    const rawValue = params.payload[field.name];
    const hasValue =
      rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== "";

    if (!params.partial && field.required && !hasValue) {
      errors.push(`${field.label} is required.`);
      continue;
    }

    if (!hasValue) {
      if (params.partial) continue;
      data[field.name] = null;
      continue;
    }

    const coerced = coerceFieldValue(field, rawValue);

    if (field.type === "email" && typeof coerced === "string") {
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coerced);
      if (!validEmail) {
        errors.push(`${field.label} must be a valid email address.`);
      }
    }

    if (field.type === "number" && typeof coerced !== "number") {
      errors.push(`${field.label} must be a number.`);
    }

    data[field.name] = coerced;
  }

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}

export function buildDashboardMetrics(
  entities: RuntimeEntityDefinition[],
  records: RuntimeRecord[],
  notificationsCount: number,
  workflowsCount: number
) {
  const perEntity = entities.map((entity) => ({
    entity: entity.name,
    count: records.filter((record) => record.entityName === entity.name).length,
  }));

  return {
    totalRecords: records.length,
    totalEntities: entities.length,
    notificationsCount,
    workflowsCount,
    perEntity,
  };
}
