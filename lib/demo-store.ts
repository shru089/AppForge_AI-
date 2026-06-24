/**
 * In-memory store for demo pipeline results.
 * Scoped to the Node.js process lifetime — perfect for demos.
 * Demo users don't have real DB rows, so results live here.
 */

import type { PipelineResult } from "@/types/pipeline";

declare global {
  // eslint-disable-next-line no-var
  var __demoStore: Map<string, PipelineResult> | undefined;
}

// Use globalThis to survive Next.js hot-reloads in dev
const store: Map<string, PipelineResult> =
  globalThis.__demoStore ?? (globalThis.__demoStore = new Map());

export const demoStore = {
  set(id: string, result: PipelineResult) {
    store.set(id, result);
  },
  get(id: string): PipelineResult | undefined {
    return store.get(id);
  },
  has(id: string): boolean {
    return store.has(id);
  },
};
