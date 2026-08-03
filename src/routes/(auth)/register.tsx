import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAppStore } from '../../store';
import AuthLayout from '../../componennts/AuthLayout';
import { Apple } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/(auth)/register')({
  component: RouteComponent,
  beforeLoad: () => {
    const { token } = useAppStore.getState();
    if (token) {
      throw redirect({ to: '/pin' });
    }
  }
})

function RouteComponent() {

  return <AuthLayout>
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          <img src="/long_logo.png" alt="est8Ledger" className="h-10" />
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              Get Started Today
            </h2>
            <p className="text-sm text-slate-600">
              Download our mobile app to create your account and manage your properties
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <a
            href="https://apps.apple.com/us/app/est8ledger/id6759548753"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex-1 inline-flex items-center justify-center gap-2.5 min-h-12 px-5 py-3 rounded-full bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0ee3] focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <Apple size={22} aria-hidden="true" className="shrink-0 fill-white" />
            <span className="text-left leading-tight">
              <span className="block text-[10px] font-normal text-white/70">Download on the</span>
              <span className="block text-sm font-semibold">App Store</span>
            </span>
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.rentalynk.est8ledger&hl=en&pli=1"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex-1 inline-flex items-center justify-center gap-2.5 min-h-12 px-5 py-3 rounded-full bg-white text-slate-900 border border-slate-200 shadow-sm transition-all duration-200 hover:border-[#3f0ee3]/40 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f0ee3] focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <svg viewBox="0 0 512 512" className="h-5.5 w-5.5 shrink-0 fill-current" aria-hidden="true">
              <path d="M99.617 8.057a50.191 50.191 0 0 0-38.815-6.713l230.932 230.933 74.846-74.846L99.617 8.057zM32.139 20.116c-6.441 8.563-10.148 19.077-10.148 30.199v411.358c0 11.122 3.708 21.636 10.148 30.199l235.717-235.878L32.139 20.116zM480.615 225.641l-67.323-37.895-84.833 84.833 84.833 84.833 67.323-37.895c30.696-17.696 30.696-73.181 0-93.876zM61.061 502.577a50.191 50.191 0 0 0 38.815-6.713l266.963-149.834-74.846-74.846-230.932 231.393z" />
            </svg>
            <span className="text-left leading-tight">
              <span className="block text-[10px] font-normal text-slate-500">Get it on</span>
              <span className="block text-sm font-semibold">Google Play</span>
            </span>
          </a>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500">or</span>
        </div>
      </div>

      <div className="space-y-3">
        
        <p className="text-center text-xs text-slate-500">
          Already have an account? <Link to="/login"> <span className='font-bold text-[#3f0ee3]'>Continue logging in</span></Link>
        </p>
      </div>
    </div>
  </AuthLayout>
}
