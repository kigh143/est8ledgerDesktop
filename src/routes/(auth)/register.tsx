import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAppStore } from '../../store';
import AuthLayout from '../../componennts/AuthLayout';
import { Download, LogIn } from 'lucide-react';
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
      <div className="bg-[#552ae7]/10 border border-[#552ae7]/25 rounded-lg p-4">
        <p className="text-sm font-semibold text-[#552ae7] text-center">
          📱 Account creation is available in our mobile application
        </p>
      </div>

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

        <div className="flex flex-col gap-3 pt-4">
          <a
            href="https://play.google.com/store/apps/details?id=com.rentalynk.est8ledger&hl=en&pli=1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-[#552ae7] to-[#3f1e70] hover:from-[#3f1e70] hover:to-[#381751] text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg text-sm"
          >
            <Download size={18} />
            <span>Download on Play Store</span>
          </a>
          <a
            href="https://apps.apple.com/us/app/est8ledger/id6759548753"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-[#552ae7] text-[#552ae7] hover:bg-[#552ae7]/5 rounded-lg font-semibold transition-all text-sm"
          >
            <Download size={18} />
            <span>Download on App Store</span>
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
        <Link to="/login">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-semibold transition-colors text-sm">
            <LogIn size={18} />
            <span>Go to Login</span>
          </button>
        </Link>
        <p className="text-center text-xs text-slate-500">
          Already have an account? Continue logging in
        </p>
      </div>
    </div>
  </AuthLayout>
}
