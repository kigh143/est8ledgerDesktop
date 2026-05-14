import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAppStore } from '../../store';
import DashboardLayout from '../../componennts/DashboardLayout';

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
  beforeLoad: () => {
    const { user, activeProperty } = useAppStore.getState();
    if (!user) {
      throw redirect({ to: '/login' });
    }

    if (!activeProperty) {
      throw redirect({ to: '/properties' });
    }
  }
})

function RouteComponent() {
  return <DashboardLayout pageTitle='' subTitle=''>
    <Outlet />
  </DashboardLayout>

}
