import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export function useUser() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user ?? null;
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: { name?: string; image?: string }) => {
      const result = await authClient.updateUser(data);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
      revokeOtherSessions?: boolean;
    }) => {
      const result = await authClient.changePassword(data);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to change password");
    },
  });

  return {
    user,
    isPending,
    updateUser: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
  };
}
