import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/agreement')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/agreement"!</div>
}
