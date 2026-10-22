import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/agreement')({
  beforeLoad: async () => {
    throw redirect({ to: '/dashboard/agreements' })
  },
})
