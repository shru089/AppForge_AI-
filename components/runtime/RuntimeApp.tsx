"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  Database,
  FileUp,
  Loader2,
  PlayCircle,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type {
  CsvImportSummary,
  RuntimeConfig,
  RuntimeEntityDefinition,
  RuntimeNotification,
  RuntimeRecord,
  WorkflowRunSummary,
} from "@/types/runtime";

type RuntimeBootstrap = {
  config: RuntimeConfig;
  metrics: {
    totalRecords: number;
    totalEntities: number;
    notificationsCount: number;
    workflowsCount: number;
    perEntity: Array<{ entity: string; count: number }>;
  };
  notifications: RuntimeNotification[];
  workflows: WorkflowRunSummary[];
  imports: CsvImportSummary[];
};

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] p-8 text-center">
      <p className="text-sm font-semibold text-black dark:text-white">{title}</p>
      <p className="mt-2 text-sm text-gray-500 dark:text-white/50">{description}</p>
    </div>
  );
}

function DashboardCard({
  metrics,
  activeEntity,
}: {
  metrics: RuntimeBootstrap["metrics"];
  activeEntity: RuntimeEntityDefinition | null;
}) {
  const activeCount =
    metrics.perEntity.find((item) => item.entity === activeEntity?.name)?.count ?? 0;

  const cards = [
    { label: "Records", value: String(metrics.totalRecords) },
    { label: "Entities", value: String(metrics.totalEntities) },
    { label: "Notifications", value: String(metrics.notificationsCount) },
    { label: "Workflows", value: String(metrics.workflowsCount) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4"
          >
            <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-white/40">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-black dark:text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {activeEntity && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/[0.06] p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300/80">
            Active Entity
          </p>
          <p className="mt-1 text-lg font-semibold text-emerald-900 dark:text-white">
            {activeEntity.label}
          </p>
          <p className="mt-2 text-sm text-emerald-800/80 dark:text-white/60">
            {activeCount} record{activeCount === 1 ? "" : "s"} available for this
            entity.
          </p>
        </div>
      )}
    </div>
  );
}

function TableCard({
  entity,
  records,
  loading,
  onEdit,
  onDelete,
}: {
  entity: RuntimeEntityDefinition | null;
  records: RuntimeRecord[];
  loading: boolean;
  onEdit: (record: RuntimeRecord) => void;
  onDelete: (recordId: string) => void;
}) {
  if (!entity) {
    return <EmptyState title="No entity selected" description="Choose an entity to inspect its records." />;
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-white/40" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <EmptyState
        title={`No ${entity.pluralLabel.toLowerCase()} yet`}
        description="Create a record manually or import a CSV to populate the runtime."
      />
    );
  }

  const visibleFields = entity.fields.filter(
    (field) => !["id"].includes(field.name)
  );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-black dark:text-white">
            {entity.pluralLabel}
          </h3>
          <p className="text-sm text-gray-500 dark:text-white/50">
            Live CRUD data generated from your metadata.
          </p>
        </div>
        <span className="text-sm text-gray-500 dark:text-white/50">
          {records.length} items
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]">
              {visibleFields.slice(0, 5).map((field) => (
                <th
                  key={field.name}
                  className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-400 dark:text-white/40"
                >
                  {field.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wide text-gray-400 dark:text-white/40">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={record.id}
                className="border-b border-gray-100 dark:border-white/[0.06]"
              >
                {visibleFields.slice(0, 5).map((field) => (
                  <td
                    key={field.name}
                    className="px-4 py-3 text-gray-700 dark:text-white/70 align-top"
                  >
                    <span className="line-clamp-2 break-words">
                      {String(record.data[field.name] ?? "-")}
                    </span>
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(record)}
                      className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(record.id)}
                      className="rounded-lg border border-red-200 dark:border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/[0.08]"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FormCard({
  entity,
  editingRecord,
  saving,
  onSubmit,
  onCancelEdit,
}: {
  entity: RuntimeEntityDefinition | null;
  editingRecord: RuntimeRecord | null;
  saving: boolean;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  onCancelEdit: () => void;
}) {
  const [formState, setFormState] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!entity) return;

    const nextState = Object.fromEntries(
      entity.fields
        .filter((field) => !["id", "createdAt", "updatedAt"].includes(field.name))
        .map((field) => [
          field.name,
          String(editingRecord?.data[field.name] ?? ""),
        ])
    );
    setFormState(nextState);
  }, [entity, editingRecord]);

  if (!entity) {
    return (
      <EmptyState
        title="No form available"
        description="A metadata form will appear when an entity is selected."
      />
    );
  }

  const fields = entity.fields.filter(
    (field) => !["id", "createdAt", "updatedAt"].includes(field.name)
  );

  return (
    <form
      className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit(formState);
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-black dark:text-white">
            {editingRecord ? `Edit ${entity.label}` : `Create ${entity.label}`}
          </h3>
          <p className="text-sm text-gray-500 dark:text-white/50">
            The fields below are generated directly from your entity schema.
          </p>
        </div>
        {editingRecord && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-medium text-gray-600 dark:text-white/60"
          >
            Cancel edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <label key={field.name} className="space-y-2">
            <span className="text-sm font-medium text-black dark:text-white/80">
              {field.label}
              {field.required ? " *" : ""}
            </span>
            {field.type === "text" || field.type === "json" ? (
              <textarea
                rows={4}
                value={formState[field.name] ?? ""}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    [field.name]: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-sm text-black dark:text-white"
              />
            ) : (
              <input
                type={field.type === "number" ? "number" : field.type === "email" ? "email" : field.type === "date" ? "date" : "text"}
                value={formState[field.name] ?? ""}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    [field.name]: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2.5 text-sm text-black dark:text-white"
              />
            )}
            {field.description && (
              <p className="text-xs text-gray-500 dark:text-white/40">
                {field.description}
              </p>
            )}
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#dced31] to-[#fb8f44] px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {editingRecord ? "Save changes" : `Create ${entity.label}`}
      </button>
    </form>
  );
}

function CardRenderer({
  entity,
  records,
}: {
  entity: RuntimeEntityDefinition | null;
  records: RuntimeRecord[];
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-white/40">
        Summary
      </p>
      <h3 className="mt-2 text-xl font-semibold text-black dark:text-white">
        {entity ? entity.label : "Runtime"}
      </h3>
      <p className="mt-3 text-sm text-gray-600 dark:text-white/60">
        {entity
          ? `${records.length} records are currently persisted for ${entity.pluralLabel.toLowerCase()}.`
          : "Pick an entity to inspect generated runtime components."}
      </p>
    </div>
  );
}

function UnknownRenderer({ type }: { type: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/[0.06] p-5">
      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
        Unknown component: {type}
      </p>
      <p className="mt-2 text-sm text-amber-700/80 dark:text-amber-100/70">
        The runtime skipped this component safely instead of crashing.
      </p>
    </div>
  );
}

export function RuntimeApp({ projectId }: { projectId: string }) {
  const [bootstrap, setBootstrap] = useState<RuntimeBootstrap | null>(null);
  const [activePage, setActivePage] = useState<string>("Dashboard");
  const [activeEntityName, setActiveEntityName] = useState<string>("");
  const [entityRecords, setEntityRecords] = useState<Record<string, RuntimeRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingRecord, setEditingRecord] = useState<RuntimeRecord | null>(null);
  const [importing, setImporting] = useState(false);

  const activeEntity = useMemo(
    () =>
      bootstrap?.config.entities.find((entity) => entity.name === activeEntityName) ??
      null,
    [bootstrap, activeEntityName]
  );

  const pageComponents = useMemo(() => {
    if (!bootstrap) return [];
    const page =
      bootstrap.config.pages.find((item) => item.name === activePage) ??
      bootstrap.config.pages[0];
    const pageComponentSet = new Set(page?.components ?? []);

    return bootstrap.config.components.filter((component) => {
      if (pageComponentSet.size === 0) return true;
      return pageComponentSet.has(component.name);
    });
  }, [bootstrap, activePage]);

  async function loadBootstrap() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/runtime/${projectId}/config`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to load runtime.");
      }

      setBootstrap(data);
      const firstEntity = data.config.entities[0]?.name ?? "";
      setActiveEntityName((current) => current || firstEntity);
      setActivePage(data.config.pages[0]?.name ?? "Dashboard");
    } catch (runtimeError) {
      setError(
        runtimeError instanceof Error ? runtimeError.message : "Failed to load runtime."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadRecords(entityName: string) {
    if (!entityName) return;
    setRecordsLoading(true);

    try {
      const response = await fetch(`/api/runtime/${projectId}/${entityName}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to load records.");
      }

      setEntityRecords((current) => ({ ...current, [entityName]: data.records }));
    } catch (runtimeError) {
      setError(
        runtimeError instanceof Error ? runtimeError.message : "Failed to load records."
      );
    } finally {
      setRecordsLoading(false);
    }
  }

  useEffect(() => {
    void loadBootstrap();
    // We intentionally reload only when the project changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (activeEntityName) {
      void loadRecords(activeEntityName);
    }
    // Entity changes should trigger record fetches without making the helper unstable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntityName]);

  async function submitRecord(values: Record<string, string>) {
    if (!activeEntity) return;
    setSaving(true);
    setError("");

    try {
      const isEdit = Boolean(editingRecord);
      const response = await fetch(
        isEdit
          ? `/api/runtime/${projectId}/${activeEntity.name}/${editingRecord?.id}`
          : `/api/runtime/${projectId}/${activeEntity.name}`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.details?.join?.(" ") ?? data.error ?? "Failed to save record."
        );
      }

      setEditingRecord(null);
      await Promise.all([loadRecords(activeEntity.name), loadBootstrap()]);
    } catch (runtimeError) {
      setError(
        runtimeError instanceof Error ? runtimeError.message : "Failed to save record."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(recordId: string) {
    if (!activeEntity) return;
    setError("");

    try {
      const response = await fetch(
        `/api/runtime/${projectId}/${activeEntity.name}/${recordId}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to delete record.");
      }

      await Promise.all([loadRecords(activeEntity.name), loadBootstrap()]);
    } catch (runtimeError) {
      setError(
        runtimeError instanceof Error
          ? runtimeError.message
          : "Failed to delete record."
      );
    }
  }

  async function importFile(file: File) {
    if (!activeEntity) return;
    setImporting(true);
    setError("");

    try {
      const csvText = await file.text();
      const response = await fetch(
        `/api/runtime/${projectId}/${activeEntity.name}/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, csvText }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to import CSV.");
      }

      await Promise.all([loadRecords(activeEntity.name), loadBootstrap()]);
    } catch (runtimeError) {
      setError(
        runtimeError instanceof Error ? runtimeError.message : "Failed to import CSV."
      );
    } finally {
      setImporting(false);
    }
  }

  async function markNotification(notificationId: string) {
    const response = await fetch(
      `/api/runtime/${projectId}/notifications/${notificationId}`,
      { method: "PATCH" }
    );

    if (response.ok) {
      await loadBootstrap();
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 dark:text-white/40" />
      </div>
    );
  }

  if (error && !bootstrap) {
    return (
      <div className="rounded-3xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/[0.06] p-8">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 w-5 h-5 text-red-500" />
          <div>
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-200">
              Runtime unavailable
            </h2>
            <p className="mt-2 text-sm text-red-700/80 dark:text-red-100/70">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const records = activeEntity ? entityRecords[activeEntity.name] ?? [] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-white/40">
            <Sparkles className="w-4 h-4 text-[#aadd00]" />
            Metadata Runtime
          </div>
          <h1 className="mt-2 text-3xl font-bold text-black dark:text-white">
            {bootstrap?.config.projectName}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-white/50">
            Working app surface generated from your metadata: dynamic CRUD, CSV import,
            notifications, and workflow automation are live here.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void loadBootstrap()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-2 text-sm font-medium text-gray-700 dark:text-white/70"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <Link
            href={`/project/${projectId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#dced31] to-[#fb8f44] px-4 py-2 text-sm font-semibold text-black"
          >
            <Database className="w-4 h-4" />
            View generator output
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {bootstrap?.config.pages.map((page) => (
          <button
            key={page.name}
            onClick={() => setActivePage(page.name)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium border",
              activePage === page.name
                ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-gray-600 dark:text-white/60"
            )}
          >
            {page.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-6">
          <DashboardCard metrics={bootstrap!.metrics} activeEntity={activeEntity} />

          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-black dark:text-white">
                  Entity workspace
                </p>
                <p className="text-sm text-gray-500 dark:text-white/50">
                  Switch entities to see the runtime adapt in real time.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2 text-sm text-gray-600 dark:text-white/70 cursor-pointer">
                <FileUp className="w-4 h-4" />
                {importing ? "Importing..." : "Import CSV"}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  disabled={!activeEntity || importing}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void importFile(file);
                    }
                    event.target.value = "";
                  }}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {bootstrap?.config.entities.map((entity) => (
                <button
                  key={entity.name}
                  onClick={() => {
                    setActiveEntityName(entity.name);
                    setEditingRecord(null);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium border",
                    activeEntityName === entity.name
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-gray-600 dark:text-white/60"
                  )}
                >
                  {entity.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
            {pageComponents.map((component) => {
              if (component.entity && component.entity !== activeEntity?.name) {
                return null;
              }

              switch (component.type) {
                case "Dashboard":
                  return (
                    <DashboardCard
                      key={component.name}
                      metrics={bootstrap!.metrics}
                      activeEntity={activeEntity}
                    />
                  );
                case "Table":
                  return (
                    <div key={component.name} className="2xl:col-span-2">
                      <TableCard
                        entity={activeEntity}
                        records={records}
                        loading={recordsLoading}
                        onEdit={setEditingRecord}
                        onDelete={(recordId) => void deleteRecord(recordId)}
                      />
                    </div>
                  );
                case "Form":
                  return (
                    <FormCard
                      key={component.name}
                      entity={activeEntity}
                      editingRecord={editingRecord}
                      saving={saving}
                      onSubmit={submitRecord}
                      onCancelEdit={() => setEditingRecord(null)}
                    />
                  );
                case "Card":
                  return (
                    <CardRenderer
                      key={component.name}
                      entity={activeEntity}
                      records={records}
                    />
                  );
                default:
                  return <UnknownRenderer key={component.name} type={component.type} />;
              }
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-500 dark:text-white/50" />
              <h2 className="text-base font-semibold text-black dark:text-white">
                Notifications
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {bootstrap?.notifications.length ? (
                bootstrap.notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => void markNotification(notification.id)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-3 text-left",
                      notification.readAt
                        ? "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20"
                        : "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/[0.06]"
                    )}
                  >
                    <p className="text-sm font-semibold text-black dark:text-white">
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-gray-400 dark:text-white/40">
                      {formatDate(notification.createdAt)}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-white/50">
                  Workflow and record notifications will appear here.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-gray-500 dark:text-white/50" />
              <h2 className="text-base font-semibold text-black dark:text-white">
                Workflow runs
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {bootstrap?.workflows.length ? (
                bootstrap.workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 px-3 py-3"
                  >
                    <p className="text-sm font-semibold text-black dark:text-white">
                      {workflow.workflowName}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
                      {workflow.summary}
                    </p>
                    <p className="mt-2 text-xs text-gray-400 dark:text-white/40">
                      {formatDate(workflow.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-white/50">
                  Matching workflow executions will appear when records change.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
            <div className="flex items-center gap-2">
              <FileUp className="w-4 h-4 text-gray-500 dark:text-white/50" />
              <h2 className="text-base font-semibold text-black dark:text-white">
                CSV imports
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {bootstrap?.imports.length ? (
                bootstrap.imports.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 px-3 py-3"
                  >
                    <p className="text-sm font-semibold text-black dark:text-white">
                      {item.fileName}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
                      {item.successCount}/{item.rowCount} rows imported into{" "}
                      {item.entityName}.
                    </p>
                    <p className="mt-2 text-xs text-gray-400 dark:text-white/40">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-white/50">
                  Imported files will be tracked here.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-white/40">
          Feature checklist
        </p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {[
            "CSV import is wired into entity CRUD and import history.",
            "Notifications are generated from runtime actions and can be marked read.",
            "Workflow automation runs when entity events match configured workflow steps.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 px-3 py-3 text-gray-700 dark:text-white/70"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
