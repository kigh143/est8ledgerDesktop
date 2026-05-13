import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAppStore } from '../../store';

export const Route = createFileRoute('/(auth)/verify')({
  component: RouteComponent,
    beforeLoad: () => {
        const { loggedIn } = useAppStore.getState();
        if (loggedIn) {
          throw redirect({ to: '/properties' });
        }
      }
})

function RouteComponent() {
  return <div>Hello "/(auth)/Verify"!</div>
}
