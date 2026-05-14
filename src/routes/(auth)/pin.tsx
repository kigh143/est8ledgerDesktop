import { createFileRoute, redirect } from '@tanstack/react-router'
import AuthLayout from '../../componennts/AuthLayout'
import { Input } from '../../componennts/forms/Input'
import { useState } from 'react';
import { useAppStore } from '../../store';
import { validatePin } from '../../services/auth';
import { toast } from 'react-toastify';
import { getNetworkError } from '../../utils';


export const Route = createFileRoute('/(auth)/pin')({
    component: RouteComponent,
    beforeLoad: () => {
        const { token, logout } = useAppStore.getState();
        if (!token) {
            logout();
            throw redirect({ to: '/login' });
        }
    }
})

function RouteComponent() {

    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = Route.useNavigate();

    const { user, logout } = useAppStore()

    const handleLogout = () => {
        logout();
        navigate({ to: '/login' });
    }


    const handleVerifyPin = async () => {
        try {
            setLoading(true);
            const payload = { pin }
            const response = await validatePin(payload);
            setLoading(false);

            if (response.status) {
                navigate({ to: '/properties' });
            } else {
                toast.warn("Wrong Pin, please try again");
            }
        } catch (error) {
            setLoading(false);
            toast.error(getNetworkError(error));
        }
    }

    return <AuthLayout>
        <div className="w-full max-w-md">
            <h2
                className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-[#3f0ee3] bg-clip-text text-transparent leading-tight"
            >
                Welcome Back
            </h2>

            <p className="mt-4 text-slate-600 text-sm sm:text-base font-medium">
                Enter your PIN to access your account
            </p>

            <form className="mt-10 space-y-6">

                <Input
                    type='pin'
                    value={pin}
                    onChange={(pin) => setPin(pin)}
                    placeholder='Enter 4-digit PIN'
                    label='Security PIN'
                />

                <button
                    disabled={loading}
                    onClick={handleVerifyPin}
                    className="w-full h-14 bg-gradient-to-r from-[#3f0ee3] to-[#3f0ee3]/90 text-white rounded-xl text-base font-semibold shadow-lg shadow-[#3f0ee3]/40 hover:shadow-[#3f0ee3]/60 transition-all hover:from-[#3f0ee3] hover:to-[#3f0ee3] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? 'Verifying ...' : 'Verify PIN'}
                </button>
            </form>

            <div className="flex flex-col gap-3 mt-10 pt-6 border-t border-slate-200">
                <p className="text-center text-slate-600 text-sm">
                    <a href="mailto:info@est8ledger.com" target='_blank' className="text-[#3f0ee3] hover:text-[#3f0ee3]/80 font-semibold transition-colors">
                        Reset PIN
                    </a>
                </p>
                <button
                    onClick={handleLogout}
                    className="text-center text-slate-600 text-sm hover:text-slate-900 font-semibold transition-colors cursor-pointer"
                >
                    Logout
                </button>
            </div>
        </div>
    </AuthLayout>
}
