import { chatsByOrg, chatsByUser } from "./aggregates";
import type { zQueryCtx } from "../functions";

// Helper to create bounds for exact key match
function exactBounds<K>(key: K) {
  return {
    bounds: {
      lower: { key, inclusive: true },
      upper: { key, inclusive: true },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// USER STATS (for the current user's chats)
// ═══════════════════════════════════════════════════════════════════

export async function GetUserChatStats(ctx: zQueryCtx) {
  const orgId = ctx.identity.activeOrganizationId;
  const userId = ctx.identity.userId;

  const total = await chatsByUser.count(ctx, {
    namespace: orgId,
    ...exactBounds(userId),
  });

  return { total };
}

// ═══════════════════════════════════════════════════════════════════
// ORGANIZATION STATS (total chats in org - for admin views)
// ═══════════════════════════════════════════════════════════════════

export async function GetOrgChatStats(ctx: zQueryCtx) {
  const orgId = ctx.identity.activeOrganizationId;

  const total = await chatsByOrg.count(ctx, exactBounds(orgId));

  return { total };
}
