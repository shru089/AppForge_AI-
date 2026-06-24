"use client";
import { useRouter } from "next/navigation";
import { formatDate, truncate } from "@/lib/utils";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { StatusBadge } from "@/components/ui/Badge";
import { Clock, ArrowRight, PlayCircle, Trash2 } from "lucide-react";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
  prompt: string;
  status: string;
  createdAt: string | Date;
}

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this project?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/project/${project.id}`, { method: "DELETE" });
      onDelete?.(project.id);
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenRuntime = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/runtime/${project.id}`);
  };

  return (
    <div
      onClick={() => router.push(`/project/${project.id}`)}
      className="cursor-pointer group"
    >
      <LiquidGlassCard className="transition-all duration-300 group-hover:border-indigo-500/40 group-hover:bg-gray-50 dark:group-hover:bg-white/[0.05]">
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-black dark:text-white/90 truncate group-hover:text-indigo-600 dark:group-hover:text-white transition-colors tracking-tight">
                {project.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-white/50 mt-1 line-clamp-2 leading-relaxed">
                {truncate(project.prompt, 80)}
              </p>
            </div>
            <StatusBadge status={project.status} />
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/40 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(project.createdAt)}
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleOpenRuntime}
                aria-label="Open runtime"
                className="p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-500/20 text-gray-400 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Delete project"
                className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/20 text-gray-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-gray-300 dark:border-white/50 border-t-gray-600 dark:border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
              <button aria-label="View project" className="p-1.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </LiquidGlassCard>
    </div>
  );
}
