import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/renttracking')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/renttracking"!</div>
}
