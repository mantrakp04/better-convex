import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useAtom } from "jotai";
import { AuthBoundary } from "@convex-dev/better-auth/react";
import { isAuthError } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useOrganizations, useActiveOrganization, useTeams } from "@/hooks/auth/organization";
import { selectedOrganizationIdAtom, selectedTeamIdAtom } from "./store";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@better-convex/backend/convex/_generated/api";

type Session = ReturnType<typeof authClient.useSession>["data"];
type User = NonNullable<Session>["user"];
type Organizations = ReturnType<typeof useOrganizations>["organizations"];
type Organization = Organizations[number];
type Teams = ReturnType<typeof useTeams>["teams"];
type Team = Teams[number];

interface WorkspaceContextValue {
  user: User | null;
  isLoadingUser: boolean;

  organizations: Organizations;
  isLoadingOrganizations: boolean;

  selectedOrganization: Organization | null;
  setSelectedOrganization: (orgId: string | null) => void;

  teams: Teams;
  isLoadingTeams: boolean;

  selectedTeam: Team | null;
  setSelectedTeam: (teamId: string | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [selectedOrgId, setSelectedOrgId] = useAtom(selectedOrganizationIdAtom);
  const [selectedTeamId, setSelectedTeamId] = useAtom(selectedTeamIdAtom);
  const navigate = useNavigate();

  const { data: session, isPending: isLoadingUser } = authClient.useSession();
  const user = session?.user ?? null;

  const { organizations, isPending: isLoadingOrganizations } = useOrganizations();
  const { activeOrganization } = useActiveOrganization();

  const selectedOrganization = useMemo(() => {
    if (!selectedOrgId) return null;
    return organizations.find((org) => org.id === selectedOrgId) ?? null;
  }, [selectedOrgId, organizations]);

  const { teams, isPending: isLoadingTeams } = useTeams(selectedOrgId ?? undefined);

  const selectedTeam = useMemo(() => {
    if (!selectedTeamId) return null;
    return teams.find((team) => team.id === selectedTeamId) ?? null;
  }, [selectedTeamId, teams]);

  const hasAutoSelectedOrg = useRef(false);
  const hasAutoSelectedTeam = useRef(false);

  useEffect(() => {
    if (isLoadingOrganizations || organizations.length === 0) {
      hasAutoSelectedOrg.current = false;
      return;
    }

    const needsAutoSelect =
      !selectedOrgId || !organizations.some((org) => org.id === selectedOrgId);

    if (needsAutoSelect && !hasAutoSelectedOrg.current) {
      hasAutoSelectedOrg.current = true;
      const firstOrg = organizations[0];
      setSelectedOrgId(firstOrg.id);
    }
  }, [isLoadingOrganizations, organizations, selectedOrgId, setSelectedOrgId]);

  useEffect(() => {
    if (isLoadingTeams || !selectedOrgId) {
      hasAutoSelectedTeam.current = false;
      return;
    }

    if (teams.length === 0) {
      if (selectedTeamId) {
        setSelectedTeamId(null);
      }
      return;
    }

    const needsAutoSelect = !selectedTeamId || !teams.some((team) => team.id === selectedTeamId);

    if (needsAutoSelect && !hasAutoSelectedTeam.current) {
      hasAutoSelectedTeam.current = true;
      const firstTeam = teams[0];
      setSelectedTeamId(firstTeam.id);
    }
  }, [isLoadingTeams, teams, selectedTeamId, selectedOrgId, setSelectedTeamId]);

  useEffect(() => {
    hasAutoSelectedTeam.current = false;
  }, [selectedOrgId]);

  useEffect(() => {
    if (!selectedOrgId) return;

    if (activeOrganization?.id !== selectedOrgId) {
      authClient.organization.setActive({ organizationId: selectedOrgId });
    }
  }, [selectedOrgId, activeOrganization?.id]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      user,
      isLoadingUser,
      organizations,
      isLoadingOrganizations,
      selectedOrganization,
      setSelectedOrganization: setSelectedOrgId,
      teams,
      isLoadingTeams,
      selectedTeam,
      setSelectedTeam: setSelectedTeamId,
    }),
    [
      user,
      isLoadingUser,
      organizations,
      isLoadingOrganizations,
      selectedOrganization,
      setSelectedOrgId,
      teams,
      isLoadingTeams,
      selectedTeam,
      setSelectedTeamId,
    ]
  );

  return (
    <WorkspaceContext value={value}>
      <AuthBoundary
        authClient={authClient}
        // This can do anything you like, a redirect is typical.
        onUnauth={() => navigate({ to: "/auth" })}
        getAuthUserFn={api.auth.getAuthUser}
        isAuthError={isAuthError}
      >
        {children}
      </AuthBoundary>
    </WorkspaceContext>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
