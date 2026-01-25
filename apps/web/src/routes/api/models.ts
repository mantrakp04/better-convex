import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/models")({
  server: {
    handlers: {
      GET: async () => {
        const res = await fetch("https://openrouter.ai/api/frontend/models");
        if (!res.ok) {
          return new Response(JSON.stringify({ error: "Failed to fetch models" }), {
            status: res.status,
            headers: { "Content-Type": "application/json" },
          });
        }
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600", // Cache for 1 hour
          },
        });
      },
    },
  },
});
