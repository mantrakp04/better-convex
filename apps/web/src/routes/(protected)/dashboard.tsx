import { api } from "@better-convex/backend/convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";

export const Route = createFileRoute("/(protected)/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const privateData = useSuspenseQuery(convexQuery(api.privateData.get, {}));

  return (
    <div className="flex flex-col gap-1">
      <h1>Dashboard</h1>
      <p>privateData: {privateData.data?.message}</p>
    </div>
  );
}
