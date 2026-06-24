import { db } from "./db";

export async function recordMetric(data: {
  projectId: string;
  stage: string;
  latencyMs: number;
  success: boolean;
  repairCount?: number;
}) {
  try {
    await db.metric.create({
      data: {
        projectId: data.projectId,
        stage: data.stage,
        latencyMs: data.latencyMs,
        success: data.success,
        repairCount: data.repairCount ?? 0,
      },
    });
  } catch {
    // Non-critical — swallow metric errors silently
    console.warn("[Metrics] Failed to record metric:", data);
  }
}

export async function getProjectMetrics(projectId: string) {
  const metrics = await db.metric.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  const totalLatency = metrics.reduce((acc, m) => acc + m.latencyMs, 0);
  const successCount = metrics.filter((m) => m.success).length;
  const totalRepairs = metrics.reduce((acc, m) => acc + m.repairCount, 0);

  return {
    metrics,
    summary: {
      totalLatencyMs: totalLatency,
      successRate:
        metrics.length > 0
          ? Math.round((successCount / metrics.length) * 100)
          : 0,
      totalRepairs,
      stageCount: metrics.length,
    },
  };
}

export async function getDashboardStats(userId: string) {
  const projects = await db.project.findMany({
    where: { userId },
    include: { metrics: true },
  });

  const totalProjects = projects.length;
  const completedProjects = projects.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const failedProjects = projects.filter((p) => p.status === "FAILED").length;

  const allMetrics = projects.flatMap((p) => p.metrics);
  const avgLatency =
    allMetrics.length > 0
      ? Math.round(
          allMetrics.reduce((acc, m) => acc + m.latencyMs, 0) /
            allMetrics.length
        )
      : 0;

  const successRate =
    totalProjects > 0
      ? Math.round((completedProjects / totalProjects) * 100)
      : 0;

  const totalRepairs = allMetrics.reduce((acc, m) => acc + m.repairCount, 0);

  return {
    totalProjects,
    completedProjects,
    failedProjects,
    successRate,
    avgLatencyMs: avgLatency,
    totalRepairs,
  };
}
