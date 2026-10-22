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

  return (
    <div className='flex h-screen w-full flex-col items-center justify-center bg-white'>
      <img src="/long_logo.png" alt="est8Ledger" className="h-9 animate-fade-up" />
      <span className="mt-8 h-1 w-24 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Loading">
        <span className="block h-full w-1/3 animate-pulse rounded-full bg-[#3f0ee3]" />
      </span>
    </div>
  )
}
