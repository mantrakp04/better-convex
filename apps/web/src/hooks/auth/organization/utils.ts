import { ROLE_HIERARCHY } from "./types";

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function canManageRole(currentRole: string | null, targetRole: string): boolean {
  if (!currentRole) return false;
  const currentLevel = ROLE_HIERARCHY[currentRole] ?? 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0;
  return currentLevel > targetLevel;
}

export function normalizeSlug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
