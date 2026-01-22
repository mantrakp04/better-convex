import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(protected)/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(protected)/settings/"!</div>
}
