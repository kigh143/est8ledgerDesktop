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
      await checkUserExisits(payload);
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
        className="text-[32px] font-semibold leading-tight tracking-[-0.03em] text-slate-900"
      >
        Enter your code
      </h2>

      <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
        We sent a 6-digit code to <span className="font-semibold text-slate-900">{authData.loginWith === 'email' ? authData.email : `+${authData.country?.dialingCode}${authData.phoneNumber}`}</span>
      </p>

      <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }}>

        <Input
          type='text'
          value={otp}
          onChange={(otp) => setOtp(otp)}
          placeholder='6-digit code'
          label='Verification Code'
        />

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg w-full"
        >
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </form>

      {
        timer > 0 ?
          <p className="text-center text-slate-500 text-sm mt-8 tabular-nums">
            {Resending ? 'Sending a new code…' : `You can request a new code in ${timer}s`}
          </p>
          :
          <p className="text-center text-slate-500 text-sm mt-8">
            Didn't receive the code?{' '}
            <button onClick={handleResendCode} className="text-[#3f0ee3] font-semibold hover:underline">
              Send a new code
            </button>
          </p>
      }
    </div>
  </AuthLayout>
}
