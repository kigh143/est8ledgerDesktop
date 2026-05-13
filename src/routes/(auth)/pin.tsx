import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/pin')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(auth)/pin"!</div>
}
