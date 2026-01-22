import { authClient } from "@/lib/auth-client";

type Session = ReturnType<typeof authClient.useSession>["data"];
export type User = NonNullable<Session>["user"];

type ListOrganizationsData = ReturnType<typeof authClient.useListOrganizations>["data"];
export type Organization = NonNullable<ListOrganizationsData>[number];

type ActiveOrganizationData = ReturnType<typeof authClient.useActiveOrganization>["data"];
export type FullOrganization = NonNullable<ActiveOrganizationData>;

export type Member = NonNullable<FullOrganization["members"]>[number];

type ListUserInvitationsResult = Awaited<ReturnType<typeof authClient.organization.listUserInvitations>>;
export type Invitation = NonNullable<ListUserInvitationsResult["data"]>[number];

type ListTeamsResult = Awaited<ReturnType<typeof authClient.organization.listTeams>>;
export type Team = NonNullable<ListTeamsResult["data"]>[number];

type ListTeamMembersResult = Awaited<ReturnType<typeof authClient.organization.listTeamMembers>>;
export type TeamMember = NonNullable<ListTeamMembersResult["data"]>[number];

export type MemberRole = "member" | "admin" | "owner";

export const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
] as const;

export const ROLE_HIERARCHY: Record<string, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};
