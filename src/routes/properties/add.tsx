import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/properties/add')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/properties/add"!</div>
}
