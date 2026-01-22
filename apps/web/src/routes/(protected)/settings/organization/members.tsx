import { createFileRoute } from '@tanstack/react-router'
import { MembersTab } from '@/components/auth/organization'

export const Route = createFileRoute(
  '/(protected)/settings/organization/members',
)({
  component: MembersTab,
})
