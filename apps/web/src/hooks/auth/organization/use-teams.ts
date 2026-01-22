import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import type { Team, TeamMember } from "./types";

export const teamKeys = {
  all: ["teams"] as const,
  organization: (orgId: string) => [...teamKeys.all, "organization", orgId] as const,
  members: (teamId: string) => [...teamKeys.all, "members", teamId] as const,
};

export function useTeams(organizationId?: string) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const orgId = organizationId ?? activeOrganization?.id;
  const queryClient = useQueryClient();

  const { data: teams = [], isPending } = useQuery({
    queryKey: teamKeys.organization(orgId ?? ""),
    queryFn: async () => {
      if (!orgId) return [];
      const result = await authClient.organization.listTeams({
        query: { organizationId: orgId },
      });
      return (result.data ?? []) as Team[];
    },
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await authClient.organization.createTeam({ name, organizationId: orgId });
      return result.data;
    },
    onSuccess: () => {
      toast.success("Team created successfully");
      queryClient.invalidateQueries({ queryKey: teamKeys.organization(orgId ?? "") });
    },
    onError: (error: { error?: { message?: string } }) => {
      toast.error(error.error?.message || "Failed to create team");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ teamId, data }: { teamId: string; data: { name?: string } }) => {
      await authClient.organization.updateTeam({ teamId, data });
    },
    onSuccess: () => {
      toast.success("Team updated successfully");
      queryClient.invalidateQueries({ queryKey: teamKeys.organization(orgId ?? "") });
    },
    onError: (error: { error?: { message?: string } }) => {
      toast.error(error.error?.message || "Failed to update team");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (teamId: string) => {
      await authClient.organization.removeTeam({ teamId, organizationId: orgId });
    },
    onSuccess: () => {
      toast.success("Team deleted successfully");
      queryClient.invalidateQueries({ queryKey: teamKeys.organization(orgId ?? "") });
    },
    onError: (error: { error?: { message?: string } }) => {
      toast.error(error.error?.message || "Failed to delete team");
    },
  });

  return {
    teams,
    isPending,
    createTeam: createMutation.mutateAsync,
    updateTeam: (teamId: string, data: { name?: string }) =>
      updateMutation.mutateAsync({ teamId, data }),
    deleteTeam: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useTeamMembers(teamId?: string) {
  const queryClient = useQueryClient();

  const { data: members = [], isPending } = useQuery({
    queryKey: teamKeys.members(teamId ?? ""),
    queryFn: async () => {
      if (!teamId) return [];
      const result = await authClient.organization.listTeamMembers({
        query: { teamId },
      });
      return (result.data ?? []) as TeamMember[];
    },
    enabled: !!teamId,
  });

  const addMutation = useMutation({
    mutationFn: async ({ userId, targetTeamId }: { userId: string; targetTeamId: string }) => {
      await authClient.organization.addTeamMember({ teamId: targetTeamId, userId });
    },
    onSuccess: () => {
      toast.success("Member added to team");
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId ?? "") });
    },
    onError: (error: { error?: { message?: string } }) => {
      toast.error(error.error?.message || "Failed to add member to team");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async ({ userId, targetTeamId }: { userId: string; targetTeamId: string }) => {
      await authClient.organization.removeTeamMember({ teamId: targetTeamId, userId });
    },
    onSuccess: () => {
      toast.success("Member removed from team");
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId ?? "") });
    },
    onError: (error: { error?: { message?: string } }) => {
      toast.error(error.error?.message || "Failed to remove member from team");
    },
  });

  return {
    members,
    isPending,
    addTeamMember: (userId: string, targetTeamId: string) =>
      addMutation.mutateAsync({ userId, targetTeamId }),
    removeTeamMember: (userId: string, targetTeamId: string) =>
      removeMutation.mutateAsync({ userId, targetTeamId }),
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
