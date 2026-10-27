"use client";
import { BrandStudio } from "../brand/BrandStudio";
import type { TabProps } from "./shared";

export function BrandTab(props: TabProps) {
  return <BrandStudio {...props} />;
}
