import { defineEntSchema, getEntDefinitions } from "convex-ents";
import { todosEnt } from "./tables/todos";
import { todoAssignedUsersEnt } from "./tables/todoAssignedUsers";
import { chatsEnt } from "./tables/chats";

const schema = defineEntSchema({
  todos: todosEnt,
  todoAssignedUsers: todoAssignedUsersEnt,
  chats: chatsEnt,
});

export default schema;
export const entDefinitions = getEntDefinitions(schema);
