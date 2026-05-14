import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/advertise')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/advertise"!</div>
}
