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
      // setLoading(true);
      const cleanPhone = phoneNumberWithCountryCode(authData?.phoneNumber ?? '', authData?.phoneNumber ?? '');
      const payload = authData.loginWith === 'email'
        ? { otp, email: authData.email }
        : { otp, phoneNumber: cleanPhone };

      const response = await verifyOTP(payload);

      if (response.user.role === 'MGT') {
        login(response);
        setToken(response.accessToken)
        navigate({ to: '/pin' })
        console.log(response);
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
        className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#181f5c] leading-tight"
      >
        Verification
      </h2>

      <p className="mt-3 text-gray-400 text-sm sm:text-base">
        Please enter the 6 digit code wesent to your <b>{authData.loginWith === 'email' ? authData.email : `+${authData.country?.dialingCode}${authData.phoneNumber}`}</b>
      </p>

      <div className="mt-10 space-y-6">

        <Input
          type='text'
          value={otp}
          onChange={(otp) => setOtp(otp)}
          placeholder='Enter Otp'
          label=''
        />

        <button
          onClick={handleVerifyOtp}
          disabled={loading}
          className="w-full h-14 bg-[#1b1b1b] text-white rounded-xl text-base font-semibold hover:bg-black transition"
        >
          {loading ? 'Loading ...' : 'Verify'}
        </button>
      </div>
      {
        timer > 0 ?
          <p className="text-center text-gray-400 text-sm mt-12">
            {Resending ? ' Resending code ...' : `The OTP will expire in ${timer} mins`}
          </p>
          :
          <p className="text-center text-gray-400 text-sm mt-12">
            I didt receive the code{' '}
            <button onClick={handleResendCode} className="text-blue-600 font-medium">
              {' '} Resend Code
            </button>
          </p>
      }
    </div>
  </AuthLayout>
}
