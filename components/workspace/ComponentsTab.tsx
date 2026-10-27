"use client";
import { ComponentLibrary } from "../library/ComponentLibrary";
import type { TabProps } from "./shared";

export function ComponentsTab(props: TabProps) {
  return <ComponentLibrary {...props} />;
}
