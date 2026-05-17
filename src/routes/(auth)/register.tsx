import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useAppStore } from '../../store';
import AuthLayout from '../../componennts/AuthLayout';
import { Eye, EyeOff, Download } from 'lucide-react';
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
 
      <div className="">
        <div className="flex flex-col items-center gap-4">
          <img src="/long_logo.png" alt="est8Ledger" className="h-10" />
          <h3 className="text-lg font-bold text-slate-900 text-center">
            Create Your Account with Our Application
          </h3>
          <p className="text-sm text-slate-600 text-center max-w-sm">
            Download the est8Ledger app to manage your properties on the go
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <a
            href="https://play.google.com/store/apps/details?id=com.rentalynk.est8ledger&hl=en&pli=1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors text-sm"
          >
            <Download size={18} />
            <span>Play Store</span>
          </a>
          <a
            href="https://apps.apple.com/us/app/est8ledger/id6759548753"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors text-sm"
          >
            <Download size={18} />
            <span>App Store</span>
          </a>
        </div>
      </div>
    </div>
  </AuthLayout>
}
