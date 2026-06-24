import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { RuntimeApp } from "@/components/runtime/RuntimeApp";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Runtime" };
export const dynamic = "force-dynamic";

export default async function RuntimePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#030108] text-black dark:text-white transition-colors duration-500">
      <Sidebar user={session.user} />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <RuntimeApp projectId={id} />
        </div>
      </main>
    </div>
  );
}
