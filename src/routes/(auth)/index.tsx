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
    <div className='relative w-full h-screen flex justify-center items-center overflow-hidden'>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-[#3f0ee3]/30"></div>

      <img
        src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=1400&auto=format&fit=crop"
        alt="Luxury House"
        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60"></div>

      <div className="relative z-10 flex flex-col items-center gap-4 text-white">
        <img src="/long_logo.png" alt="est8Ledger" className="h-20" />
        <p className='text-white'>Property Managing done the right way</p>
      </div>
    </div>
  )
}
