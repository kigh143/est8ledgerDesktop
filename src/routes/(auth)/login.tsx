import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useAppStore } from '../../store';
import AuthLayout from '../../componennts/AuthLayout';
import { Input } from '../../componennts/forms/Input';
import { Select } from '../../componennts/forms/Select';
import type { AuthData, Country } from '../../types';
import configurationService from '../../services/config';
import { useState } from 'react';
import { checkUserExisits } from '../../services/auth';
import { getNetworkError, phoneNumberWithCountryCode } from '../../utils';
import { toast } from 'react-toastify';

export const Route = createFileRoute('/(auth)/login')({
  component: RouteComponent,
  beforeLoad: () => {
    const { token } = useAppStore.getState();
    if (token) {
      throw redirect({ to: '/pin' });
    }
  },
  loader: async () => {
    const countries = await configurationService.getCountries();
    return {
      countries
    }
  }
})

type LoginWith = AuthData['loginWith'];

function RouteComponent() {

  const [loading, setLoading] = useState(false);
  const { authData, setAuthData } = useAppStore();
  const { countries } = Route.useLoaderData();
  const navigate = Route.useNavigate();

  const handleLogin = async() => {
      try {
        setLoading(true);
        const cleanPhone = phoneNumberWithCountryCode(authData?.phoneNumber??'', authData?.phoneNumber??'');

        const payload =authData.loginWith === 'email'?
         {
          email:authData.email
        }: {
          phoneNumber:cleanPhone
        };
        const response = await checkUserExisits(payload);
        setLoading(false);
        if(response.status){
            navigate({to:'/verify'});
        }
      } catch (error) {
        setLoading(false);
        const errorMessage = getNetworkError(error)
        toast.error(errorMessage)
      }
  }

  return <AuthLayout>
    <div className="w-full max-w-md">
      <h2
        className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#181f5c] leading-tight"
      >
        Welcome Back to est8Ledger!
      </h2>

      <p className="mt-3 text-gray-400 text-sm sm:text-base">
        Sign in your account
      </p>

      <form className="mt-10 space-y-6">

        <Select
          label="Log in with"
          options={[{ value: "email", label: "Email Address" }, { value: "phone", label: 'Phone Number' }]}
          value={authData?.loginWith}
          onChange={(loginWith: LoginWith) => setAuthData({ ...authData, loginWith })}
          placeholder="Select option"
        />

        {
          authData?.loginWith === 'email' ? (
            <Input
              label='Email'
              onChange={(text: string) => setAuthData({ ...authData, email: text })}
              value={authData.email || ''}
              placeholder='Enter Email Address'
            />
          ) : authData?.loginWith === 'phone' && (
            <>
              <Select
                label="Select Country"
                options={countries.map((country: Country) => ({ label: `${country.flag}-${country.name}`, value: country.id }))}
                value={authData?.country?.id || null}
                onChange={(countryId) => setAuthData({ ...authData, country: countries.find((country: Country) => country.id === +countryId) })}
                placeholder="Select Country"
              />

              <Input
                label='Phone Number'
                countryCode={authData.loginWith === 'phone' ? authData.country?.dialingCode : ''}
                onChange={(text: string) => setAuthData({ ...authData, phoneNumber: text })}
                value={authData?.phoneNumber || ''}
                placeholder='Enter 7*********** '
              />
            </>
          )
        }



        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-14 bg-[#1b1b1b] text-white rounded-xl text-base font-semibold hover:bg-black transition"
        >
          {loading? 'Loading ... ' :'Login'}
        </button>
      </form>

      <p className="text-center text-gray-400 text-sm mt-12">
        Don't have any account?
        <Link to='/register'>
          <span className="text-blue-600 font-medium">
            {' '}Register
          </span>
        </Link>
      </p>
    </div>
  </AuthLayout>
}
