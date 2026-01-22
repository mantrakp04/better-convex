import { createFileRoute } from '@tanstack/react-router'
import { OrganizationTab } from '@/components/auth/organization'

export const Route = createFileRoute('/(protected)/settings/organization/')({
  component: OrganizationTab,
})
