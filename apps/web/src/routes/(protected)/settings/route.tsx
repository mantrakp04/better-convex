import { Tabs, TabsTrigger, TabsList } from '@/components/ui/tabs'
import { createFileRoute, Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { useCallback } from 'react';

export const Route = createFileRoute('/(protected)/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = useCallback((value: string) => {
    navigate({
      to: `/settings/${value}`,
    });
  }, [navigate]);

  const paths = [
    { value: "", label: "User" },
    { value: "organization", label: "Organization" },
  ]

  return (
    <Tabs value={location.pathname.split('/').pop()}>
      <TabsList>
        {paths.map(({ value, label }) => (
          <TabsTrigger key={value} value={value} onClick={() => handleChange(value)}>{label}</TabsTrigger>
        ))}
      </TabsList>
      <div className="border border-border rounded-xl p-2 h-full">
        <Outlet />
      </div>
    </Tabs>
  )
}
