import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/securitydeposits')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/securitydeposits"!</div>
}
