import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import type { Member, MemberRole } from "./types";

export const memberKeys = {
  all: ["members"] as const,
  organization: (orgId: string) => [...memberKeys.all, "organization", orgId] as const,
  active: () => [...memberKeys.all, "active"] as const,
};

export function useMembers(organizationId?: string) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const orgId = organizationId ?? activeOrganization?.id;
  const queryClient = useQueryClient();

  const { data: members = [], isPending } = useQuery({
    queryKey: memberKeys.organization(orgId ?? ""),
    queryFn: async () => {
      if (!orgId) return [];
      const result = await authClient.organization.listMembers({
        query: { organizationId: orgId },
      });
      return (result.data?.members ?? []) as Member[];
    },
    enabled: !!orgId,
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: MemberRole }) => {
      await authClient.organization.inviteMember({ email, role, organizationId: orgId });
    },
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      queryClient.invalidateQueries({ queryKey: memberKeys.organization(orgId ?? "") });
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (error: { error?: { message?: string } }) => {
      toast.error(error.error?.message || "Failed to send invitation");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (memberIdOrEmail: string) => {
      await authClient.organization.removeMember({ memberIdOrEmail, organizationId: orgId });
    },
    onSuccess: () => {
      toast.success("Member removed successfully");
      queryClient.invalidateQueries({ queryKey: memberKeys.organization(orgId ?? "") });
    },
    onError: (error: { error?: { message?: string } }) => {
      toast.error(error.error?.message || "Failed to remove member");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: MemberRole }) => {
      await authClient.organization.updateMemberRole({ memberId, role, organizationId: orgId });
    },
    onSuccess: () => {
      toast.success("Member role updated successfully");
      queryClient.invalidateQueries({ queryKey: memberKeys.organization(orgId ?? "") });
    },
    onError: (error: { error?: { message?: string } }) => {
      toast.error(error.error?.message || "Failed to update member role");
    },
  });

  return {
    members,
    isPending,
    inviteMember: (email: string, role: MemberRole = "member") =>
      inviteMutation.mutateAsync({ email, role }),
    removeMember: removeMutation.mutateAsync,
    updateMemberRole: (memberId: string, role: MemberRole) =>
      updateRoleMutation.mutateAsync({ memberId, role }),
    isInviting: inviteMutation.isPending,
    isRemoving: removeMutation.isPending,
    isUpdatingRole: updateRoleMutation.isPending,
  };
}

export function useActiveMember() {
  const { data: activeMember, isPending } = useQuery({
    queryKey: memberKeys.active(),
    queryFn: async () => {
      const result = await authClient.organization.getActiveMember();
      return result.data;
    },
  });

  return {
    activeMember,
    isPending,
    currentUserRole: activeMember?.role ?? null,
  };
}
