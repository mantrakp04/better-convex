import { createFileRoute } from '@tanstack/react-router'
import { TeamsTab } from '@/components/auth/organization'

export const Route = createFileRoute(
  '/(protected)/settings/organization/teams',
)({
  component: TeamsTab,
})
