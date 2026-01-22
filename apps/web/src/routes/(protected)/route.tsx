import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { WorkspaceProvider } from "@/providers/workspace";

export const Route = createFileRoute("/(protected)")({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/auth" });
    }
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return (
    <WorkspaceProvider>
      <div className="flex-1 overflow-y-auto bg-background">
        <Outlet />
      </div>
    </WorkspaceProvider>
  );
}
