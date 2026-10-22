import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';

type LayoutProps = {
    children: ReactNode;
    showBackBtn?: boolean
}

const AuthLayout = ({ children, showBackBtn = false }: LayoutProps) => {
    return (
        <div className="min-h-screen w-full bg-white grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
            {/* Inset photograph, framed like a listing hero */}
            <div className="relative hidden lg:block p-3">
                <div className="relative h-full overflow-hidden rounded-[28px] bg-slate-900">
                    <img
                        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    <div className="absolute left-8 top-8 rounded-xl bg-white/90 px-3.5 py-2.5 backdrop-blur-md">
                        <img src="/long_logo.png" alt="est8Ledger" className="h-5" />
                    </div>

                    <div className="absolute inset-x-10 bottom-10 text-white">
                        <h2 className="max-w-md text-[40px] font-semibold leading-[1.08] tracking-[-0.03em]">
                            Every tenancy, deposit and repair in one ledger.
                        </h2>
                        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
                            Sign agreements, collect rent and deposits, and keep inspections on record for each of your properties.
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative flex flex-col items-center justify-center px-6 py-12 sm:px-12">
                {showBackBtn && (
                    <Link
                        to="/login"
                        className="absolute left-5 top-5 flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-[#3f0ee3] hover:bg-[#3f0ee3]/[0.06]"
                    >
                        <ChevronLeft size={18} strokeWidth={2.25} />
                        Back
                    </Link>
                )}

                <img src="/long_logo.png" alt="est8Ledger" className="mb-10 h-6 lg:hidden" />

                <div className="w-full max-w-[400px] animate-fade-up">{children}</div>
            </div>
        </div>
    )
}

export default AuthLayout;
