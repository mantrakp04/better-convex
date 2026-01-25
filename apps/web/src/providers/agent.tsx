import { useAgent } from "agents/react";
import { useRouteContext } from "@tanstack/react-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { env } from "@just-use-convex/env/web";

export function useTokenClient() {
  const context = useRouteContext({ from: "__root__" });
  return context.tokenClient;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentInstance = ReturnType<typeof useAgent<any>>;

type AgentContextValue = {
  agents: Map<string, AgentInstance>;
  register: (id: string) => void;
  unregister: (id: string) => void;
  setAgent: (id: string, agent: AgentInstance) => void;
};

const AgentContext = createContext<AgentContextValue | null>(null);

function AgentConnection({ id }: { id: string }) {
  const tokenClient = useTokenClient();
  const ctx = useContext(AgentContext);
  const token = tokenClient.getToken();

  // Memoize the query object to prevent unnecessary re-renders
  const query = useMemo(() => ({ token: token ?? "" }), [token]);

  const agent = useAgent({
    agent: "agent",
    name: id,
    host: env.VITE_AGENT_URL,
    query,
  });

  const setAgent = ctx?.setAgent;
  const agentRef = useRef(agent);

  // Only update if the agent instance actually changed
  useEffect(() => {
    if (setAgent && agentRef.current !== agent) {
      agentRef.current = agent;
      setAgent(id, agent);
    }
  }, [setAgent, id, agent]);

  return null;
}

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Map<string, AgentInstance>>(
    () => new Map()
  );
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(
    () => new Set()
  );

  const register = useCallback((id: string) => {
    setRegisteredIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setRegisteredIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setAgents((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const setAgent = useCallback((id: string, agent: AgentInstance) => {
    setAgents((prev) => {
      if (prev.get(id) === agent) return prev;
      const next = new Map(prev);
      next.set(id, agent);
      return next;
    });
  }, []);

  const value = useMemo<AgentContextValue>(
    () => ({ agents, register, unregister, setAgent }),
    [agents, register, unregister, setAgent]
  );

  return (
    <AgentContext.Provider value={value}>
      {Array.from(registeredIds).map((id) => (
        <AgentConnection key={id} id={id} />
      ))}
      {children}
    </AgentContext.Provider>
  );
}

export function useAgentById(id: string) {
  const ctx = useContext(AgentContext);

  if (!ctx) {
    throw new Error("useAgentById must be used within AgentProvider");
  }

  const { register, unregister, agents } = ctx;

  useEffect(() => {
    register(id);
    return () => unregister(id);
  }, [register, unregister, id]);

  const agent = agents.get(id) ?? null;

  return {
    agent,
    isLoading: !agent,
  };
}
