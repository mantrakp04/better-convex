import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { api } from "@better-convex/backend/convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";

export const Route = createFileRoute("/(protected)")({
  component: ProtectedLayout,
  loader: async ({ context }) => {
    const [user] = await Promise.all([
      context.queryClient.ensureQueryData(
        convexQuery(api.auth.getCurrentUser, {})
      ),
    ]);
    if (!user) {
      throw redirect({
        to: "/auth",
      });
    }
  },
});

function ProtectedLayout() {
  return (
    <div className="flex-1 overflow-y-auto bg-background h-full container mx-auto w-4xl py-2">
      <Outlet />
    </div>
  );
}
