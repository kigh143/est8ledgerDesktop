import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAppStore } from '../../store';

export const Route = createFileRoute('/properties/')({
  component: RouteComponent,
   beforeLoad: () => {
      const { user } = useAppStore.getState();
      if (!user) {
        throw redirect({ to: '/login' });
      }
    }
})

function RouteComponent() {
  return <div>Hello "/properties/"!</div>
}
