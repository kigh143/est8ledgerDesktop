
import { ArrowLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';

type LayoutProps = {
    children: any;
    showBackBtn?: boolean
}

const AuthLayout = ({ children, showBackBtn = false }: LayoutProps) => {
    return (
        <div className="w-full h-screen bg-white overflow-hidden grid grid-cols-1 lg:grid-cols-2">
            <div className="relative hidden lg:flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-[#3f0ee3]/30"></div>

                <img
                    src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=1400&auto=format&fit=crop"
                    alt="Luxury House"
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
                />

                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60"></div>

                <div className="relative z-10 p-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#3f0ee3] to-[#3f0ee3]/80 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xl">E8</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">est8Ledger</h1>
                    </div>
                </div>

                <div className="relative z-10 px-14 pb-20">
                    <h2 className="text-5xl lg:text-6xl font-bold leading-tight text-white max-w-md">
                        Digital Property <span className="bg-gradient-to-r from-[#7fe502] to-[#7fe502]/80 bg-clip-text text-transparent">Management</span>
                    </h2>

                    <p className="mt-6 text-lg text-white/90 max-w-md leading-relaxed">
                        Create, sign, and store digital agreements securely. Track maintenance requests, manage repairs, and keep all property documentation in one accessible place.
                    </p>

                    <div className="flex items-center gap-3 mt-10">
                        <div className="w-12 h-1 rounded-full bg-gradient-to-r from-[#3f0ee3] to-[#7fe502]"></div>
                        <div className="w-2 h-2 rounded-full bg-white/40"></div>
                        <div className="w-2 h-2 rounded-full bg-white/40"></div>
                    </div>
                </div>
            </div>

            <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-white via-slate-50 to-[#3f0ee3]/5 px-6 py-10 sm:px-10 md:px-14 md:py-14">
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
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3f0ee3] to-[#3f0ee3]/80 flex items-center justify-center shadow-lg">
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