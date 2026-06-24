import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { demoStore } from "@/lib/demo-store";
import {
  buildRuntimeConfig,
  validateRecordInput,
} from "@/lib/runtime/schema";
import type {
  CsvImportSummary,
  RuntimeConfig,
  RuntimeNotification,
  RuntimeRecord,
  WorkflowRunSummary,
} from "@/types/runtime";

type RuntimeContext =
  | {
      mode: "demo";
      projectId: string;
      userId: string;
      config: RuntimeConfig;
    }
  | {
      mode: "db";
      projectId: string;
      userId: string;
      config: RuntimeConfig;
    };

type DemoState = {
  records: Map<string, RuntimeRecord[]>;
  notifications: RuntimeNotification[];
  workflows: WorkflowRunSummary[];
  imports: CsvImportSummary[];
};

declare global {
  var __runtimeDemoState: Map<string, DemoState> | undefined;
}

const runtimeDemoState =
  globalThis.__runtimeDemoState ?? (globalThis.__runtimeDemoState = new Map());

function getDemoState(projectId: string): DemoState {
  const existing = runtimeDemoState.get(projectId);
  if (existing) return existing;

  const initial: DemoState = {
    records: new Map(),
    notifications: [],
    workflows: [],
    imports: [],
  };
  runtimeDemoState.set(projectId, initial);
  return initial;
}

function nowIso() {
  return new Date().toISOString();
}

function randomId() {
  return crypto.randomUUID();
}

function normalizeRuntimeNotification(item: {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt?: Date | string | null;
  createdAt?: Date | string;
  metadata?: Record<string, unknown> | null;
}): RuntimeNotification {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    message: item.message,
    readAt: item.readAt ? new Date(item.readAt).toISOString() : null,
    createdAt: new Date(item.createdAt ?? new Date()).toISOString(),
    metadata: item.metadata ?? null,
  };
}

function normalizeWorkflowRun(item: {
  id: string;
  workflowName: string;
  entityName?: string | null;
  action: string;
  status: string;
  summary: string;
  createdAt?: Date | string;
}): WorkflowRunSummary {
  return {
    id: item.id,
    workflowName: item.workflowName,
    entityName: item.entityName ?? null,
    action: item.action,
    status: item.status,
    summary: item.summary,
    createdAt: new Date(item.createdAt ?? new Date()).toISOString(),
  };
}

function normalizeImportSummary(item: {
  id: string;
  entityName: string;
  fileName: string;
  status: string;
  rowCount: number;
  successCount: number;
  failureCount: number;
  createdAt?: Date | string;
  errors?: Array<{ row: number; message: string }> | null;
}): CsvImportSummary {
  return {
    id: item.id,
    entityName: item.entityName,
    fileName: item.fileName,
    status: item.status,
    rowCount: item.rowCount,
    successCount: item.successCount,
    failureCount: item.failureCount,
    createdAt: new Date(item.createdAt ?? new Date()).toISOString(),
    errors: item.errors ?? null,
  };
}

export async function getRuntimeContext(
  projectId: string,
  userId: string
): Promise<RuntimeContext> {
  const demoProject = demoStore.get(projectId);
  if (demoProject) {
    return {
      mode: "demo",
      projectId,
      userId,
      config: {
        projectId,
        projectName: `Demo App - ${demoProject.intent.appType}`,
        appType: demoProject.intent.appType,
        entities: demoProject.systemDesign.entities.map((entity) => ({
          name: entity.name,
          label: entity.name,
          pluralLabel: entity.name.endsWith("s") ? entity.name : `${entity.name}s`,
          fields: entity.fields.map((field) => ({
            name: field.name,
            label: field.name,
            type: ["Int", "Float"].includes(field.type) ? "number" : field.type === "Boolean" ? "boolean" : field.type === "DateTime" ? "datetime" : field.type === "Json" ? "json" : "string",
            required: field.required,
            unique: field.unique,
            description: field.description,
          })),
        })),
        pages: demoProject.schemas.uiSchema.pages.map((page) => ({
          name: page.name,
          path: page.path,
          auth: page.auth,
          roles: page.roles ?? [],
          components: page.components,
        })),
        components: demoProject.schemas.uiSchema.components.map((component) => ({
          name: component.name,
          type: component.type,
          entity: component.entity,
          fields: component.fields,
          props: component.props,
        })),
        workflows: demoProject.systemDesign.workflows,
        roles: demoProject.intent.roles,
        locale: "en",
      },
    };
  }

  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: { generatedSchema: true },
  });

  if (!project || !project.generatedSchema) {
    throw new Error("Project runtime not found.");
  }

  return {
    mode: "db",
    projectId,
    userId,
    config: buildRuntimeConfig({
      projectId,
      projectName: project.name,
      generatedSchema: project.generatedSchema,
    }),
  };
}

function matchWorkflowAction(action: string, event: string) {
  const normalizedAction = action.toLowerCase();
  return (
    normalizedAction.includes(event) ||
    normalizedAction.includes(event === "create" ? "new" : event)
  );
}

async function emitAutomation(
  context: RuntimeContext,
  event: "create" | "update" | "delete" | "import",
  entityName: string,
  detail: string,
  metadata?: Record<string, unknown>
) {
  const notification = normalizeRuntimeNotification({
    id: randomId(),
    type: event,
    title: `${entityName} ${event}d`,
    message: detail,
    metadata,
  });

  const matchingWorkflows = context.config.workflows.filter((workflow) =>
    workflow.steps.some(
      (step) =>
        (!step.entity || step.entity === entityName) &&
        matchWorkflowAction(step.action, event)
    )
  );

  const workflowRuns = matchingWorkflows.map((workflow) =>
    normalizeWorkflowRun({
      id: randomId(),
      workflowName: workflow.name,
      entityName,
      action: event,
      status: "completed",
      summary: `${workflow.name} ran after ${detail.toLowerCase()}`,
    })
  );

  if (context.mode === "demo") {
    const state = getDemoState(context.projectId);
    state.notifications.unshift(notification);
    state.workflows.unshift(...workflowRuns);
    return;
  }

  await db.runtimeNotification.create({
    data: {
      projectId: context.projectId,
      userId: context.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata:
        (notification.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
    },
  });

  if (workflowRuns.length > 0) {
    await db.workflowRun.createMany({
      data: workflowRuns.map((run) => ({
        projectId: context.projectId,
        workflowName: run.workflowName,
        entityName: run.entityName ?? undefined,
        action: run.action,
        status: run.status,
        summary: run.summary,
        payload: (metadata as Prisma.InputJsonValue | undefined) ?? undefined,
      })),
    });
  }
}

export async function listRuntimeRecords(
  context: RuntimeContext,
  entityName: string
): Promise<RuntimeRecord[]> {
  if (context.mode === "demo") {
    return getDemoState(context.projectId).records.get(entityName) ?? [];
  }

  const rows = await db.runtimeRecord.findMany({
    where: { projectId: context.projectId, entityName },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    entityName: row.entityName,
    data: row.data as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function listAllRuntimeRecords(
  context: RuntimeContext
): Promise<RuntimeRecord[]> {
  if (context.mode === "demo") {
    return Array.from(getDemoState(context.projectId).records.values()).flat();
  }

  const rows = await db.runtimeRecord.findMany({
    where: { projectId: context.projectId },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    entityName: row.entityName,
    data: row.data as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function createRuntimeRecord(
  context: RuntimeContext,
  entityName: string,
  payload: Record<string, unknown>
) {
  const entity = context.config.entities.find((item) => item.name === entityName);
  if (!entity) {
    throw new Error(`Unknown entity "${entityName}".`);
  }

  const validation = validateRecordInput({ entity, payload });
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  const record: RuntimeRecord = {
    id: randomId(),
    entityName,
    data: validation.data,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  if (context.mode === "demo") {
    const state = getDemoState(context.projectId);
    const records = state.records.get(entityName) ?? [];
    state.records.set(entityName, [record, ...records]);
  } else {
    await db.runtimeRecord.create({
      data: {
        id: record.id,
        projectId: context.projectId,
        entityName,
        data: record.data as Prisma.InputJsonValue,
        createdById: context.userId,
        updatedById: context.userId,
      },
    });
  }

  await emitAutomation(
    context,
    "create",
    entityName,
    `${entity.label} record created`,
    { recordId: record.id, entityName }
  );

  return { success: true, record };
}

export async function updateRuntimeRecord(
  context: RuntimeContext,
  entityName: string,
  recordId: string,
  payload: Record<string, unknown>
) {
  const entity = context.config.entities.find((item) => item.name === entityName);
  if (!entity) {
    throw new Error(`Unknown entity "${entityName}".`);
  }

  const validation = validateRecordInput({ entity, payload, partial: true });
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  if (context.mode === "demo") {
    const state = getDemoState(context.projectId);
    const records = state.records.get(entityName) ?? [];
    const current = records.find((item) => item.id === recordId);
    if (!current) throw new Error("Record not found.");

    current.data = { ...current.data, ...validation.data };
    current.updatedAt = nowIso();

    await emitAutomation(
      context,
      "update",
      entityName,
      `${entity.label} record updated`,
      { recordId, entityName }
    );

    return { success: true, record: current };
  }

  const row = await db.runtimeRecord.findFirst({
    where: { id: recordId, projectId: context.projectId, entityName },
  });
  if (!row) throw new Error("Record not found.");

  const mergedData = {
    ...(row.data as Record<string, unknown>),
    ...validation.data,
  };

  const updated = await db.runtimeRecord.update({
    where: { id: row.id },
    data: {
      data: mergedData as Prisma.InputJsonValue,
      updatedById: context.userId,
    },
  });

  await emitAutomation(
    context,
    "update",
    entityName,
    `${entity.label} record updated`,
    { recordId, entityName }
  );

  return {
    success: true,
    record: {
      id: updated.id,
      entityName: updated.entityName,
      data: updated.data as Record<string, unknown>,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  };
}

export async function deleteRuntimeRecord(
  context: RuntimeContext,
  entityName: string,
  recordId: string
) {
  if (context.mode === "demo") {
    const state = getDemoState(context.projectId);
    const records = state.records.get(entityName) ?? [];
    state.records.set(
      entityName,
      records.filter((item) => item.id !== recordId)
    );
  } else {
    await db.runtimeRecord.deleteMany({
      where: { id: recordId, projectId: context.projectId, entityName },
    });
  }

  await emitAutomation(
    context,
    "delete",
    entityName,
    `${entityName} record deleted`,
    { recordId, entityName }
  );

  return { success: true };
}

export async function listRuntimeNotifications(
  context: RuntimeContext
): Promise<RuntimeNotification[]> {
  if (context.mode === "demo") {
    return getDemoState(context.projectId).notifications.slice(0, 25);
  }

  const rows = await db.runtimeNotification.findMany({
    where: { projectId: context.projectId, userId: context.userId },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return rows.map((row) =>
    normalizeRuntimeNotification({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      readAt: row.readAt,
      createdAt: row.createdAt,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    })
  );
}

export async function markNotificationRead(
  context: RuntimeContext,
  notificationId: string
) {
  if (context.mode === "demo") {
    const notification = getDemoState(context.projectId).notifications.find(
      (item) => item.id === notificationId
    );
    if (notification) notification.readAt = nowIso();
    return { success: true };
  }

  await db.runtimeNotification.updateMany({
    where: {
      id: notificationId,
      projectId: context.projectId,
      userId: context.userId,
    },
    data: { readAt: new Date() },
  });

  return { success: true };
}

export async function listWorkflowRuns(
  context: RuntimeContext
): Promise<WorkflowRunSummary[]> {
  if (context.mode === "demo") {
    return getDemoState(context.projectId).workflows.slice(0, 25);
  }

  const rows = await db.workflowRun.findMany({
    where: { projectId: context.projectId },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return rows.map((row) =>
    normalizeWorkflowRun({
      id: row.id,
      workflowName: row.workflowName,
      entityName: row.entityName,
      action: row.action,
      status: row.status,
      summary: row.summary,
      createdAt: row.createdAt,
    })
  );
}

export async function createCsvImportJob(
  context: RuntimeContext,
  summary: CsvImportSummary
) {
  if (context.mode === "demo") {
    getDemoState(context.projectId).imports.unshift(summary);
    return summary;
  }

  await db.csvImportJob.create({
    data: {
      id: summary.id,
      projectId: context.projectId,
      entityName: summary.entityName,
      fileName: summary.fileName,
      status: summary.status,
      rowCount: summary.rowCount,
      successCount: summary.successCount,
      failureCount: summary.failureCount,
      errors: (summary.errors as Prisma.InputJsonValue | undefined) ?? undefined,
    },
  });

  return summary;
}

export async function listCsvImportJobs(
  context: RuntimeContext
): Promise<CsvImportSummary[]> {
  if (context.mode === "demo") {
    return getDemoState(context.projectId).imports.slice(0, 10);
  }

  const rows = await db.csvImportJob.findMany({
    where: { projectId: context.projectId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return rows.map((row) =>
    normalizeImportSummary({
      id: row.id,
      entityName: row.entityName,
      fileName: row.fileName,
      status: row.status,
      rowCount: row.rowCount,
      successCount: row.successCount,
      failureCount: row.failureCount,
      createdAt: row.createdAt,
      errors:
        (row.errors as Array<{ row: number; message: string }> | null) ?? null,
    })
  );
}

function parseCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { headers: [], rows: [] as Record<string, string>[] };
  }

  const headers = lines[0].split(",").map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    );
  });

  return { headers, rows };
}

export async function importCsvRecords(params: {
  context: RuntimeContext;
  entityName: string;
  fileName: string;
  csvText: string;
}) {
  const parsed = parseCsv(params.csvText);
  const errors: Array<{ row: number; message: string }> = [];
  let successCount = 0;

  for (const [index, row] of parsed.rows.entries()) {
    const result = await createRuntimeRecord(
      params.context,
      params.entityName,
      row as Record<string, unknown>
    );

    if (result.success) {
      successCount += 1;
    } else {
      errors.push({
        row: index + 2,
        message: result.errors?.join(" ") ?? "Import failed.",
      });
    }
  }

  const summary = normalizeImportSummary({
    id: randomId(),
    entityName: params.entityName,
    fileName: params.fileName,
    status: errors.length === 0 ? "completed" : "completed_with_errors",
    rowCount: parsed.rows.length,
    successCount,
    failureCount: errors.length,
    errors,
  });

  await createCsvImportJob(params.context, summary);
  await emitAutomation(
    params.context,
    "import",
    params.entityName,
    `CSV import completed for ${params.entityName}`,
    {
      fileName: params.fileName,
      rowCount: parsed.rows.length,
      successCount,
      failureCount: errors.length,
    }
  );

  return summary;
}
