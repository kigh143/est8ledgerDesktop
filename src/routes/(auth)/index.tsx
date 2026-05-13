import { createFileRoute } from '@tanstack/react-router'
import { useAppStore } from '../../store';
import { useEffect } from 'react';

export const Route = createFileRoute('/(auth)/')({
  component: RouteComponent,
})

function RouteComponent() {
  const state = useAppStore();
  const navigate = Route.useNavigate();

  const checkLoggedIn = () => {
    if (!state.token) {
      state.logout();
      navigate({ to: '/login' })
    } else {
      navigate({ to: '/pin' })
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      checkLoggedIn();
    }, 1500);

    return () => clearTimeout(timer);
  }, [])

  return <div style={{ backgroundColor: '#3f0ee3' }} className='flex justify-center items-center  h-screen text-white'>
    <h1 className='font-bold text-2xl'>Est8Legder</h1>
  </div>
}
