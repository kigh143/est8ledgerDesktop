import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/inspections')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/inspections"!</div>
}
