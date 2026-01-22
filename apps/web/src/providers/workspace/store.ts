import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const STORAGE_KEY = "workspace-preferences";

interface WorkspacePreferences {
  selectedOrganizationId: string | null;
  selectedTeamId: string | null;
}

const defaultPreferences: WorkspacePreferences = {
  selectedOrganizationId: null,
  selectedTeamId: null,
};

export const workspacePreferencesAtom = atomWithStorage<WorkspacePreferences>(
  STORAGE_KEY,
  defaultPreferences
);

export const selectedOrganizationIdAtom = atom(
  (get) => get(workspacePreferencesAtom).selectedOrganizationId,
  (get, set, organizationId: string | null) => {
    const current = get(workspacePreferencesAtom);
    set(workspacePreferencesAtom, {
      ...current,
      selectedOrganizationId: organizationId,
      selectedTeamId: null,
    });
  }
);

export const selectedTeamIdAtom = atom(
  (get) => get(workspacePreferencesAtom).selectedTeamId,
  (get, set, teamId: string | null) => {
    const current = get(workspacePreferencesAtom);
    set(workspacePreferencesAtom, {
      ...current,
      selectedTeamId: teamId,
    });
  }
);
