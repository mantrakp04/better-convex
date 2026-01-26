import type { ChatSettings } from "@/components/chat";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import { env } from "@just-use-convex/env/web";
import { useAgent } from "agents/react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useSyncExternalStore,
  useRef,
  type ReactNode,
  createElement,
} from "react";
import { createRoot, type Root } from "react-dom/client";

type AgentChatInstance = ReturnType<typeof useAgentChat>;

type InstanceData = {
  chat: AgentChatInstance | null;
  settings: ChatSettings;
  setSettings: (settingsOrFn: ChatSettings | ((prev: ChatSettings) => ChatSettings)) => void;
};

type AgentsContextValue = {
  requestInstance: (chatId: string) => void;
  subscribe: (chatId: string, callback: () => void) => () => void;
  getSnapshot: (chatId: string) => InstanceData | undefined;
};

const AgentsContext = createContext<AgentsContextValue | null>(null);

const instanceDataStore = new Map<string, InstanceData>();
const subscribersStore = new Map<string, Set<() => void>>();

function notifySubscribers(chatId: string) {
  subscribersStore.get(chatId)?.forEach((cb) => cb());
}

function updateInstanceData(chatId: string, data: InstanceData) {
  instanceDataStore.set(chatId, data);
  notifySubscribers(chatId);
}

type IsolatedInstance = {
  root: Root;
  container: HTMLDivElement;
};

const isolatedInstances = new Map<string, IsolatedInstance>();

function AgentInstanceInner({ chatId }: { chatId: string }) {
  const [settings, setSettingsState] = useState<ChatSettings>({});

  const handleStateUpdate = useCallback(
    (state: ChatSettings | undefined, source: string) => {
      if (source === "server" && state) {
        setSettingsState(state);
      }
    },
    []
  );

  const handleError = useCallback((error: Error) => {
    console.error("Chat error:", error);
  }, []);

  const setSettings = useCallback(
    (settingsOrFn: ChatSettings | ((prev: ChatSettings) => ChatSettings)) => {
      setSettingsState((prev: ChatSettings) =>
        typeof settingsOrFn === "function" ? settingsOrFn(prev) : settingsOrFn
      );
    },
    []
  );

  const chatRef = useRef<AgentChatInstance | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const handleMessage = useCallback(() => {
    updateInstanceData(chatId, {
      chat: chatRef.current,
      settings: settingsRef.current,
      setSettings,
    });
  }, [chatId, setSettings]);

  const agent = useAgent<ChatSettings>({
    agent: "agent-worker",
    name: chatId,
    host: env.VITE_AGENT_URL,
    onStateUpdate: handleStateUpdate,
    onMessage: handleMessage,
  });

  const chat = useAgentChat({
    agent,
    credentials: "include",
    resume: true,
    onError: handleError,
  });

  chatRef.current = chat;

  useEffect(() => {
    updateInstanceData(chatId, { chat, settings, setSettings });
  }, [chatId, chat, settings, setSettings]);

  return null;
}

function createIsolatedInstance(chatId: string): void {
  if (isolatedInstances.has(chatId)) return;

  // Create a hidden container for this instance
  const container = document.createElement("div");
  container.style.display = "none";
  container.dataset.agentInstance = chatId;
  document.body.appendChild(container);

  // Create a separate React root - this won't be affected by parent re-renders
  const root = createRoot(container);
  root.render(createElement(AgentInstanceInner, { chatId }));

  isolatedInstances.set(chatId, { root, container });
}

// function destroyIsolatedInstance(chatId: string): void {
//   const instance = isolatedInstances.get(chatId);
//   if (!instance) return;

//   instance.root.unmount();
//   instance.container.remove();
//   isolatedInstances.delete(chatId);
//   instanceDataStore.delete(chatId);
// }

export function AgentsProvider({ children }: { children: ReactNode }) {
  const requestInstance = useCallback((chatId: string) => {
    createIsolatedInstance(chatId);
  }, []);

  const subscribe = useCallback((chatId: string, callback: () => void) => {
    if (!subscribersStore.has(chatId)) {
      subscribersStore.set(chatId, new Set());
    }
    subscribersStore.get(chatId)!.add(callback);

    return () => {
      subscribersStore.get(chatId)?.delete(callback);
    };
  }, []);

  const getSnapshot = useCallback((chatId: string) => {
    return instanceDataStore.get(chatId);
  }, []);

  const value = useMemo<AgentsContextValue>(
    () => ({
      requestInstance,
      subscribe,
      getSnapshot,
    }),
    [requestInstance, subscribe, getSnapshot]
  );

  return (
    <AgentsContext.Provider value={value}>
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgentsContext() {
  const context = useContext(AgentsContext);
  if (!context) {
    throw new Error("useAgentsContext must be used within an AgentsProvider");
  }
  return context;
}

export function useAgentInstance(chatId: string) {
  const { requestInstance, subscribe, getSnapshot } = useAgentsContext();

  // Request the instance on mount
  useEffect(() => {
    requestInstance(chatId);
  }, [chatId, requestInstance]);

  // Subscribe to updates using useSyncExternalStore
  const subscribeToChat = useCallback(
    (callback: () => void) => subscribe(chatId, callback),
    [chatId, subscribe]
  );

  const getSnapshotForChat = useCallback(
    () => getSnapshot(chatId),
    [chatId, getSnapshot]
  );

  const data = useSyncExternalStore(subscribeToChat, getSnapshotForChat, getSnapshotForChat);

  return {
    chat: data?.chat ?? null,
    settings: data?.settings ?? {},
    setSettings: data?.setSettings ?? (() => {}),
    isReady: !!data?.chat,
  };
}
