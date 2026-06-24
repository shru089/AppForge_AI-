"use client";

import dynamic from "next/dynamic";

export const LiquidBackgroundWrapper = dynamic(
  () => import("./LiquidBackground").then((mod) => mod.LiquidBackground),
  { ssr: false }
);
