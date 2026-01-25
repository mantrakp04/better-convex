import { useNavigate, useLocation } from "@tanstack/react-router";
import { Tabs, TabsTrigger, TabsList } from "./ui/tabs";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { to: "", label: "Home" },
    { to: "docs", label: "Docs" },
    { to: "dashboard", label: "Dashboard" },
    { to: "chats", label: "Chats" },
    { to: "settings", label: "Settings" },
  ] as const;

  const activeTab = location.pathname === "/" ? "" : Object.values(links).filter(({ to }) => to !== "").find(({ to }) =>
    location.pathname.includes(to))?.to;

  return (
    <Tabs
      defaultValue={activeTab}
      className="container mx-auto w-4xl border border-border rounded-lg mt-2 px-.5 overflow-x-auto no-scrollbar z-50"
    >
      <TabsList variant="line" className={`w-full justify-between`}>
        {links.map(({ to, label }) => (
          <TabsTrigger key={to} value={to} onClick={() => navigate({ to: `/${to}` })} className='cursor-pointer' >{label}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
