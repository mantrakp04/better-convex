import { atomWithStorage } from "jotai/utils";

// Persisted favorite model slugs
export const favoriteModelsAtom = atomWithStorage<string[]>(
  "favorite-models",
  [],
  undefined,
  { getOnInit: true }
);
