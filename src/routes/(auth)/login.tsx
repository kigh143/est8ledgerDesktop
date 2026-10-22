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
import { Segmented } from '../../componennts/dashboard/ui';

export const Route = createFileRoute('/(auth)/login')({
  component: RouteComponent,
  beforeLoad: () => {
    const { token } = useAppStore.getState();
    if (token) {
      throw redirect({ to: '/pin' });
    }
  },
  loader: async () => {
    // Phone sign-in needs the country list; email sign-in still works if it fails to load.
    const countries: Country[] = await configurationService.getCountries().catch(() => []);
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
        className="text-[32px] font-semibold leading-tight tracking-[-0.03em] text-slate-900"
      >
        Welcome back
      </h2>

      <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
        Sign in with your email address or phone number.
      </p>

      <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>

        <div className="flex">
          <Segmented<LoginWith>
            ariaLabel="Sign in with"
            value={authData?.loginWith ?? 'email'}
            onChange={(value) => setAuthData({ ...authData, loginWith: value })}
            options={[{ value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone' }]}
          />
        </div>

        {
          authData?.loginWith === 'email' ? (
            <Input
              label='Email'
              onChange={(text: string) => setAuthData({ ...authData, email: text })}
              value={authData.email || ''}
              placeholder='name@example.com'
            />
          ) : authData?.loginWith === 'phone' && (
            <>
              <Select
                label="Select Country"
                options={countries.map((country: Country) => ({ label: `${country.flag} (+${country.dialingCode}) ${country.name}`, value: country.id }))}
                value={authData?.country?.id || null}
                onChange={(countryId) => setAuthData({ ...authData, country: countries.find((country: Country) => country.id === +countryId) ?? null })}
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
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg w-full"
        >
          {loading ? 'Checking…' : 'Continue'}
        </button>
      </form>

      <p className="text-center text-slate-500 text-sm mt-10">
        Don't have an account?
        <Link to='/register'>
          <span className="ml-1 text-[#3f0ee3] font-semibold hover:underline">
            Create an account
          </span>
        </Link>
      </p>
    </div>
  </AuthLayout>
}
