import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAppStore } from '../../store';

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
  beforeLoad: () => {
    const { user, activeProperty } = useAppStore.getState();
    if (!user) {
      throw redirect({ to: '/login' });
    }

    if(!activeProperty){
      throw redirect({ to: '/properties' });
    }
  }
})

function RouteComponent() {
  return <div>Hello "/(dashboard)/"!
    <Outlet />
  </div>
}
