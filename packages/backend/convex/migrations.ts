import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api.js";
import type { DataModel } from "./_generated/dataModel.js";

export const migrations = new Migrations<DataModel>(components.migrations);

export const run = migrations.runner();

export const addIsPinnedToChats = migrations.define({
  table: "chats",
  migrateOne: async (ctx, chat) => {
    if ((chat as Record<string, unknown>).isPinned === undefined) {
      await ctx.db.patch(chat._id, { isPinned: false });
    }
  },
});
