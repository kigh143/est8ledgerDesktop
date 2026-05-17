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
        className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-[#3f0ee3] bg-clip-text text-transparent leading-tight"
      >
        Welcome Back!
      </h2>

      <p className="mt-3 text-slate-600 text-sm sm:text-base font-medium">
        Sign in to your account to continue
      </p>

      <form className="mt-10 space-y-6">

        <Select
          label="Log in with"
          options={[{ value: "email", label: "Email Address" }, { value: "phone", label: 'Phone Number' }]}
          value={authData?.loginWith}
          onChange={(value) => setAuthData({ ...authData, loginWith: value as LoginWith })}
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
                options={countries.map((country: Country) => ({ label: `${country.flag} (+${country.dialingCode}) ${country.name}`, value: country.id }))}
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
          className="w-full h-14 bg-gradient-to-r from-[#3f0ee3] to-[#3f0ee3]/90 text-white rounded-xl text-base font-semibold shadow-lg shadow-[#3f0ee3]/40 hover:shadow-[#3f0ee3]/60 transition-all hover:from-[#3f0ee3] hover:to-[#3f0ee3] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading? 'Loading ... ' :'Login'}
        </button>
      </form>

      <p className="text-center text-slate-600 text-sm mt-12">
        Don't have an account?
        <Link to='/register'>
          <span className="ml-1 text-[#3f0ee3] font-semibold hover:text-[#3f0ee3]/80 transition-colors">
            Register
          </span>
        </Link>
      </p>
    </div>
  </AuthLayout>
}
