import { useState, useMemo } from "react";
import { useAtom } from "jotai";
import { favoriteModelsAtom } from "@/store/models";
import type { OpenRouterModel } from "@/hooks/use-openrouter-models";

function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase().replace(/[-_.]/g, "");
  const t = target.toLowerCase().replace(/[-_.]/g, "");
  if (q === t) return true;
  if (t.includes(q)) return true;
  if (q.length < 3) return false;

  // Stricter fuzzy match: matched characters must be close together (gap <= 1)
  let qIdx = 0;
  let lastMatchIdx = -1;
  for (let tIdx = 0; tIdx < t.length && qIdx < q.length; tIdx++) {
    if (q[qIdx] === t[tIdx]) {
      // Check that gap between matches isn't too large (allow up to 1 char gap)
      if (lastMatchIdx !== -1 && tIdx - lastMatchIdx > 2) {
        return false;
      }
      qIdx++;
      lastMatchIdx = tIdx;
    }
  }
  return qIdx === q.length;
}

// Maps author slugs to logo slugs (for models.dev logos)
const PROVIDER_DOMAINS: Record<string, { logo: string, displayName: string }> = {
  // Major AI Labs
  anthropic: { logo: "anthropic", displayName: "Anthropic" },
  openai: { logo: "openai", displayName: "OpenAI" },
  google: { logo: "google", displayName: "Google" },
  "x-ai": { logo: "xai", displayName: "xAI" },
  // Chinese AI Labs
  minimax: { logo: "minimax", displayName: "MiniMax" },
  deepseek: { logo: "deepseek", displayName: "DeepSeek" },
  moonshotai: { logo: "moonshotai-cn", displayName: "Moonshot AI" },
  "z-ai": { logo: "zhipuai", displayName: "Z-AI" },
  // Research
  "black-forest-labs": { logo: "openrouter", displayName: "Black Forest Labs" },
};

const PROVIDER_KEYS = Object.keys(PROVIDER_DOMAINS);

// Fuzzy match author against PROVIDER_DOMAINS keys, returns the label if found
export function getProviderLabel(author: string): string | null {
  const authorSlug = author.toLowerCase().replace(/[\s.]+/g, "-");

  for (const key of PROVIDER_KEYS) {
    if (
      authorSlug === key ||
      fuzzyMatch(authorSlug, key) ||
      fuzzyMatch(key, authorSlug)
    ) {
      return PROVIDER_DOMAINS[key].displayName;
    }
  }
  return null;
}

// Get display name for a provider label or special category
export function getProviderDisplayName(label: string): string {
  if (label === "all") return "All";
  if (label === "favorites") return "Favorites";
  return label;
}

// Get logo slug for a provider display label
export function getProviderLogoSlug(displayLabel: string): string {
  if (displayLabel === "all" || displayLabel === "favorites") {
    return displayLabel;
  }

  for (const config of Object.values(PROVIDER_DOMAINS)) {
    if (config.displayName === displayLabel) {
      return config.logo;
    }
  }
  return displayLabel;
}

type GroupedModels = [string, OpenRouterModel[]][];

interface UseModelFilteringOptions {
  groupedModels: GroupedModels;
  models: OpenRouterModel[];
}

interface UseModelFilteringReturn {
  selectedAuthor: string;
  setSelectedAuthor: (author: string) => void;
  authors: string[];
  filteredModels: [string, OpenRouterModel[]][];
  toggleFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  favorites: string[];
}

export function useModelFiltering({
  groupedModels,
  models,
}: UseModelFilteringOptions): UseModelFilteringReturn {
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
  const [favorites, setFavorites] = useAtom(favoriteModelsAtom);

  // Cache author labels to avoid repeated fuzzy matching
  const authorLabelCache = useMemo(() => {
    const cache = new Map<string, string | null>();
    for (const [author] of groupedModels) {
      cache.set(author, getProviderLabel(author));
    }
    return cache;
  }, [groupedModels]);

  // Get unique provider labels for sidebar (only those in PROVIDER_DOMAINS)
  const authors = useMemo(() => {
    const known = ["favorites", "all"];
    const seen = new Set(known);

    for (const [author] of groupedModels) {
      const label = authorLabelCache.get(author);
      if (label && !seen.has(label)) {
        known.push(label);
        seen.add(label);
      }
    }
    return known;
  }, [groupedModels, authorLabelCache]);

  // Filter models by selected provider label
  const filteredModels = useMemo(() => {
    if (selectedAuthor === "all") {
      return groupedModels.filter(([author]) => authorLabelCache.get(author) !== null);
    }

    if (selectedAuthor === "favorites") {
      const favoriteSet = new Set(favorites);
      const groups: Record<string, OpenRouterModel[]> = {};

      for (const model of models) {
        if (favoriteSet.has(model.slug)) {
          const author = model.author || "Other";
          if (!groups[author]) groups[author] = [];
          groups[author].push(model);
        }
      }
      return Object.entries(groups) as [string, OpenRouterModel[]][];
    }

    // selectedAuthor is now a label, match authors whose label equals the selected one
    return groupedModels.filter(([author]) => authorLabelCache.get(author) === selectedAuthor);
  }, [groupedModels, models, selectedAuthor, favorites, authorLabelCache]);

  const toggleFavorite = (slug: string) => {
    setFavorites((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const isFavorite = (slug: string) => favorites.includes(slug);

  return {
    selectedAuthor,
    setSelectedAuthor,
    authors,
    filteredModels,
    toggleFavorite,
    isFavorite,
    favorites,
  };
}
