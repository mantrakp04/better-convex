import { Tabs, TabsTrigger, TabsList } from '@/components/ui/tabs'
import { createFileRoute, Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { useCallback } from 'react'

export const Route = createFileRoute('/(protected)/settings/organization')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const handleChange = useCallback((value: string) => {
    const path = value ? `/settings/organization/${value}` : '/settings/organization'
    navigate({ to: path })
  }, [navigate])

  const paths = [
    { value: '', label: 'General' },
    { value: 'members', label: 'Members' },
    { value: 'teams', label: 'Teams' },
  ]

  return (
    <Tabs defaultValue={location.pathname.split('/').pop()}>
      <TabsList>
        {paths.map(({ value, label }) => (
          <TabsTrigger key={value} value={value} onClick={() => handleChange(value)}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <Outlet />
    </Tabs>
  )
}
