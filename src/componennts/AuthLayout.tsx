
import { ArrowLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';

type LayoutProps = {
    children: any;
    showBackBtn?: boolean
}

const AuthLayout = ({ children, showBackBtn = false }: LayoutProps) => {
    return (
        <div className="w-full h-screen bg-white overflow-hidden grid grid-cols-1 lg:grid-cols-2">
            <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-purple-900/40">
                <img
                    src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=1400&auto=format&fit=crop"
                    alt="Luxury House"
                    className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
                />

                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-950"></div>

                <div className="relative z-10 p-12">
                    <div className="flex items-center gap-3">
                       <img src="/long_logo.png" alt="est8Ledger" className="h-11" />
                    </div>
                </div>

                <div className="relative z-10 px-14 pb-24">
                    <h2 className="text-5xl font-bold leading-tight text-white max-w-lg">
                        Manage Properties <span className="bg-linear-to-r from-[#7fe502] via-[#7fe502] to-[#7fe502]/80 bg-clip-text text-transparent">Effortlessly</span>
                    </h2>

                    <p className="mt-8 text-lg text-white/85 max-w-lg leading-relaxed font-light">
                        Create and sign digital agreements. Track maintenance. Manage repairs. Keep all your property documentation secure in one place.
                    </p>

                    <div className="flex items-center gap-3 mt-12">
                        <div className="h-1 w-16 rounded-full bg-linear-to-r from-[#7fe502] to-[#552ae7]"></div>
                        <div className="w-2 h-2 rounded-full bg-white/30"></div>
                        <div className="w-2 h-2 rounded-full bg-white/30"></div>
                    </div>
                </div>
            </div>

            <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-white via-slate-50 to-[#552ae7]/5 px-6 py-10 sm:px-10 md:px-14 md:py-14">
                {showBackBtn && (
                    <div className="absolute top-6 left-6">
                        <Link to="/login">
                            <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                                <ArrowLeft size={20} />
                                <span className="text-sm font-medium">Back</span>
                            </button>
                        </Link>
                    </div>
                )}

                <div className="lg:hidden mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#552ae7] to-[#552ae7]/80 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold">E8</span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">est8Ledger</h1>
                </div>

                {children}
            </div>
        </div>
    )
}

export default AuthLayout;