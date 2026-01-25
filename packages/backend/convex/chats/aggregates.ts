import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";

// ═══════════════════════════════════════════════════════════════════
// ORGANIZATION-LEVEL AGGREGATES
// ═══════════════════════════════════════════════════════════════════

// Total chat count per organization
export const chatsByOrg = new TableAggregate<{
  Key: string;
  DataModel: DataModel;
  TableName: "chats";
}>(components.chatsByOrg, {
  sortKey: (doc) => doc.organizationId,
});

// ═══════════════════════════════════════════════════════════════════
// USER-LEVEL AGGREGATES
// ═══════════════════════════════════════════════════════════════════

// Count chats by user within an organization
export const chatsByUser = new TableAggregate<{
  Namespace: string; // organizationId
  Key: string; // userId
  DataModel: DataModel;
  TableName: "chats";
}>(components.chatsByUser, {
  namespace: (doc) => doc.organizationId,
  sortKey: (doc) => doc.userId,
});

// Export all aggregates for trigger registration
export const allChatAggregates = [chatsByOrg, chatsByUser];
