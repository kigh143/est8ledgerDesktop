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

    const { logout } = useAppStore()

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
                className="text-[32px] font-semibold leading-tight tracking-[-0.03em] text-slate-900"
            >
                Welcome back
            </h2>

            <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
                Enter your security PIN to unlock your account.
            </p>

            <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); handleVerifyPin(); }}>

                <Input
                    type='pin'
                    value={pin}
                    onChange={(pin) => setPin(pin)}
                    placeholder='••••'
                    label='Security PIN'
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary btn-lg w-full"
                >
                    {loading ? 'Unlocking…' : 'Unlock'}
                </button>
            </form>

            <div className="flex items-center justify-center gap-6 mt-8">
                <a href="mailto:info@est8ledger.com" target='_blank' className="text-sm text-[#3f0ee3] hover:underline font-semibold">
                    Forgot PIN?
                </a>
                <button
                    onClick={handleLogout}
                    type="button"
                    className="text-sm text-slate-500 hover:text-slate-900 font-medium"
                >
                    Sign out
                </button>
            </div>
        </div>
    </AuthLayout>
}
