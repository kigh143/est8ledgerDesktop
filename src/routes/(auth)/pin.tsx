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
                toast("Wrong Pin, please try again");
            }
        } catch (error) {
            setLoading(false);
            toast(getNetworkError(error));
        }
    }

    return <AuthLayout>
        <div className="w-full max-w-md">
            <h2
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#181f5c] leading-tight"
            >
                Welcome back
            </h2>

            <p className="mt-3 text-gray-400 text-sm sm:text-base">
                Please {user?.user?.email ?? ''}  enter your pin to continue
            </p>

            <form className="mt-10 space-y-6">

                <Input
                    type='pin'
                    value={pin}
                    onChange={(pin) => setPin(pin)}
                    placeholder='Enter PIN'
                    label=''
                />


                <button
                    disabled={loading}
                    onClick={handleVerifyPin}
                    className="w-full h-14 bg-[#1b1b1b] text-white rounded-xl text-base font-semibold hover:bg-black transition"
                >
                    {loading ? 'Verifying ... ' : 'Verify Pin'}
                </button>
            </form>

            <p className="text-center text-gray-400 text-sm mt-12">
                I forgot my pin ?{' '}
                <a href="#" className="text-blue-600 font-medium">
                    Contact est8Ledger
                </a> |  <button onClick={handleLogout} className="text-red-600 font-medium cursor-pointer">
                    Logout
                </button>
            </p>
        </div>
    </AuthLayout>
}
