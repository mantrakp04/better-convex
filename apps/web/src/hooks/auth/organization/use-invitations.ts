import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import type { Invitation } from "./types";

const invitationKeys = {
  all: ["invitations"] as const,
  organization: (orgId: string) => [...invitationKeys.all, "organization", orgId] as const,
  user: () => [...invitationKeys.all, "user"] as const,
};

export function useInvitations(organizationId?: string) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const orgId = organizationId ?? activeOrganization?.id;
  const queryClient = useQueryClient();

  const { data: invitations = [], isPending } = useQuery({
    queryKey: invitationKeys.organization(orgId ?? ""),
    queryFn: async () => {
      if (!orgId) return [];
      const result = await authClient.organization.listInvitations({
        query: { organizationId: orgId },
      });
      return (result.data ?? []) as Invitation[];
    },
    enabled: !!orgId,
  });

  const cancelMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await authClient.organization.cancelInvitation({ invitationId });
    },
    onSuccess: () => {
      toast.success("Invitation cancelled");
      queryClient.invalidateQueries({ queryKey: invitationKeys.organization(orgId ?? "") });
    },
    onError: (error: { error?: { message?: string } }) => {
      toast.error(error.error?.message || "Failed to cancel invitation");
    },
  });

  return {
    invitations,
    isPending,
    cancelInvitation: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  };
}

export function useUserInvitations() {
  const queryClient = useQueryClient();

  const { data: invitations = [], isPending } = useQuery({
    queryKey: invitationKeys.user(),
    queryFn: async () => {
      const result = await authClient.organization.listUserInvitations();
      return (result.data ?? []) as Invitation[];
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await authClient.organization.acceptInvitation({ invitationId });
    },
    onSuccess: () => {
      toast.success("Invitation accepted");
      queryClient.invalidateQueries({ queryKey: invitationKeys.user() });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
    onError: (error: { error?: { message?: string } }) => {
      toast.error(error.error?.message || "Failed to accept invitation");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await authClient.organization.rejectInvitation({ invitationId });
    },
    onSuccess: () => {
      toast.success("Invitation rejected");
      queryClient.invalidateQueries({ queryKey: invitationKeys.user() });
    },
    onError: (error: { error?: { message?: string } }) => {
      toast.error(error.error?.message || "Failed to reject invitation");
    },
  });

  return {
    invitations,
    isPending,
    acceptInvitation: acceptMutation.mutateAsync,
    rejectInvitation: rejectMutation.mutateAsync,
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}
