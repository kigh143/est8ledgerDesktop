import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAppStore } from '../../store';
import AuthLayout from '../../componennts/AuthLayout';
import { useEffect, useState } from 'react';
import { Input } from '../../componennts/forms/Input';
import { getNetworkError, phoneNumberWithCountryCode } from '../../utils';
import { checkUserExisits, verifyOTP } from '../../services/auth';
import { toast } from 'react-toastify';

export const Route = createFileRoute('/(auth)/verify')({
  component: RouteComponent,
  beforeLoad: () => {
    const { token } = useAppStore.getState();
    if (token) {
      throw redirect({ to: '/pin' });
    }
  }
})

function RouteComponent() {

  const { authData, login, setToken } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [Resending, setResendig] = useState(false);
  const [timer, setTimer] = useState(120)
  const [otp, setOtp] = useState('');
  const navigate = Route.useNavigate();

  const handleResendCode = async () => {
    try {
      setResendig(true);
      const cleanPhone = phoneNumberWithCountryCode(authData?.phoneNumber ?? '', authData?.phoneNumber ?? '');
      const payload = authData.loginWith === 'email' ?
        {
          email: authData.email
        } : {
          phoneNumber: cleanPhone
        };
      const response = await checkUserExisits(payload);
      setResendig(false);
      setTimer(120);
    } catch (error) {
      setResendig(false);
      const errorMessage = getNetworkError(error)
      toast.error(errorMessage)
    }

  }

  const handleVerifyOtp = async () => {
    try {
      const cleanPhone = phoneNumberWithCountryCode(authData?.phoneNumber ?? '', authData?.phoneNumber ?? '');
      const payload = authData.loginWith === 'email'
        ? { otp, email: authData.email }
        : { otp, phoneNumber: cleanPhone };

      const response = await verifyOTP(payload);

      if (response.user.role === 'MGT') {
        login(response.user);
        setToken(response.accessToken)
        navigate({ to: '/pin' })
      } else {
        toast.warn('Only management can sign here. Please note that this platform is only for landlords and property managers. Please download the Est8Ledger application.')
      }
    } catch (error) {
      setLoading(false);
      const errorMessage = getNetworkError(error)
      toast.error(errorMessage)
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [])

  return <AuthLayout showBackBtn={true}>
    <div className="w-full max-w-md">
      <h2
        className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-[#3f0ee3] bg-clip-text text-transparent leading-tight"
      >
        Verify Code
      </h2>

      <p className="mt-4 text-slate-600 text-sm sm:text-base font-medium">
        We sent a 6-digit code to <span className="font-semibold text-slate-900">{authData.loginWith === 'email' ? authData.email : `+${authData.country?.dialingCode}${authData.phoneNumber}`}</span>
      </p>

      <div className="mt-10 space-y-6">

        <Input
          type='text'
          value={otp}
          onChange={(otp) => setOtp(otp)}
          placeholder='Enter 6-digit code'
          label='Verification Code'
        />

        <button
          onClick={handleVerifyOtp}
          disabled={loading}
          className="w-full h-14 bg-gradient-to-r from-[#3f0ee3] to-[#3f0ee3]/90 text-white rounded-xl text-base font-semibold shadow-lg shadow-[#3f0ee3]/40 hover:shadow-[#3f0ee3]/60 transition-all hover:from-[#3f0ee3] hover:to-[#3f0ee3] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying ...' : 'Verify Code'}
        </button>
      </div>

      {
        timer > 0 ?
          <p className="text-center text-slate-600 text-sm mt-10 font-medium">
            {Resending ? '⏳ Resending code ...' : `⏱️ Code expires in ${timer}s`}
          </p>
          :
          <p className="text-center text-slate-600 text-sm mt-10">
            Didn't receive the code?{' '}
            <button onClick={handleResendCode} className="text-[#3f0ee3] font-semibold hover:text-[#3f0ee3]/80 transition-colors">
              Resend Code
            </button>
          </p>
      }
    </div>
  </AuthLayout>
}
