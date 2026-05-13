import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/properties/$propertyId/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/properties/$propertyId"!</div>
}
