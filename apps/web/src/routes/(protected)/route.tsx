import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { AuthBoundary } from "@convex-dev/better-auth/react";
import { api } from "@better-convex/backend/convex/_generated/api";
import { isAuthError } from "@/lib/utils";

export const Route = createFileRoute("/(protected)")({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/auth" });
    }
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const navigate = useNavigate();
  
  return (
    <AuthBoundary
      authClient={authClient}
      // This can do anything you like, a redirect is typical.
      onUnauth={() => navigate({ to: "/auth" })}
      getAuthUserFn={api.auth.getAuthUser}
      isAuthError={isAuthError}
    >
      <div className="flex-1 overflow-y-auto bg-background h-full container mx-auto w-4xl py-2">
        <Outlet />
      </div>
    </AuthBoundary>
  );
}
