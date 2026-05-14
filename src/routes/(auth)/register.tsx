import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useAppStore } from '../../store';
import AuthLayout from '../../componennts/AuthLayout';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

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
  const [showPassword, setShowPassword] = useState(false);

  return <AuthLayout>
    <div className="w-full max-w-md">
      <h2
        className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-[#3f0ee3] bg-clip-text text-transparent leading-tight"
      >
        Create Account
      </h2>

      <p className="mt-4 text-slate-600 text-sm sm:text-base font-medium">
        Join est8Ledger to manage your properties
      </p>

      <form className="mt-10 space-y-5">

        <div>
          <label
            className="block text-sm font-semibold text-slate-900 mb-2"
          >
            Email Address
          </label>

          <input
            type="email"
            placeholder="you@example.com"
            className="w-full h-12 border border-slate-200 rounded-lg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f0ee3]/40 focus:border-[#3f0ee3] transition-colors"
          />
        </div>

        <div>
          <label
            className="block text-sm font-semibold text-slate-900 mb-2"
          >
            Password
          </label>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="w-full h-12 border border-slate-200 rounded-lg px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f0ee3]/40 focus:border-[#3f0ee3] transition-colors"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-semibold text-slate-900 mb-2"
          >
            Confirm Password
          </label>

          <input
            type="password"
            placeholder="Confirm your password"
            className="w-full h-12 border border-slate-200 rounded-lg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f0ee3]/40 focus:border-[#3f0ee3] transition-colors"
          />
        </div>

        <label className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            className="w-4 h-4 border border-slate-300 rounded accent-[#3f0ee3] cursor-pointer"
          />
          <span className="text-sm text-slate-600">
            I agree to the <a href="#" className="text-[#3f0ee3] hover:text-[#3f0ee3]/80 font-semibold transition-colors">Terms of Service</a>
          </span>
        </label>

        <button
          type="button"
          className="w-full h-14 bg-gradient-to-r from-[#3f0ee3] to-[#3f0ee3]/90 text-white rounded-lg text-base font-semibold shadow-lg shadow-[#3f0ee3]/40 hover:shadow-[#3f0ee3]/60 transition-all hover:from-[#3f0ee3] hover:to-[#3f0ee3] mt-6"
        >
          Create Account
        </button>
      </form>

      <p className="text-center text-slate-600 text-sm mt-10">
        Already have an account?
        <Link to='/login'>
          <span className="ml-1 text-[#3f0ee3] font-semibold hover:text-[#3f0ee3]/80 transition-colors">
            Login
          </span>
        </Link>
      </p>
    </div>
  </AuthLayout>
}
