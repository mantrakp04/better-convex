import { createFileRoute } from "@tanstack/react-router";
import { OrganizationSettings } from "@/components/auth/organization";

export const Route = createFileRoute("/(protected)/settings/organization")({
  component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
  return <OrganizationSettings />
}
