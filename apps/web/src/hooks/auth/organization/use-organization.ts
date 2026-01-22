import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import type { FullOrganization } from "./types";

export const organizationKeys = {
  all: ["organization"] as const,
  detail: (orgId: string) => [...organizationKeys.all, "detail", orgId] as const,
};

export function useOrganization(organizationId?: string) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const orgId = organizationId ?? activeOrganization?.id;
  const queryClient = useQueryClient();

  const { data: organization, isPending } = useQuery({
    queryKey: organizationKeys.detail(orgId ?? ""),
    queryFn: async () => {
      if (!orgId) return null;
      const result = await authClient.organization.getFullOrganization({
        query: { organizationId: orgId },
      });
      return result.data as FullOrganization | null;
    },
    enabled: !!orgId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { name?: string; slug?: string; logo?: string; metadata?: Record<string, unknown> }) => {
      await authClient.organization.update({ data });
    },
    onSuccess: () => {
      toast.success("Organization updated successfully");
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(orgId ?? "") });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
    onError: (error: { error?: { message?: string } }) => {
      toast.error(error.error?.message || "Failed to update organization");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (organizationIdToDelete: string) => {
      await authClient.organization.delete({ organizationId: organizationIdToDelete });
    },
    onSuccess: () => {
      toast.success("Organization deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
    onError: (error: { error?: { message?: string } }) => {
      toast.error(error.error?.message || "Failed to delete organization");
    },
  });

  return {
    organization,
    isPending,
    updateOrganization: updateMutation.mutateAsync,
    deleteOrganization: deleteMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
