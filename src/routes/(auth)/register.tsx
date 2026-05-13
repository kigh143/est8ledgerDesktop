import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useAppStore } from '../../store';
import AuthLayout from '../../componennts/AuthLayout';

export const Route = createFileRoute('/(auth)/register')({
  component: RouteComponent,
  beforeLoad: () => {
    const { token } = useAppStore.getState();
    if (token) {
      throw redirect({ to: '/pin' });
    }
  }
})

function RouteComponent() {
  return <AuthLayout>
    <div className="w-full max-w-md">
      <h2
        className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#181f5c] leading-tight"
      >
        Welcome Back to Realnest!
      </h2>

      <p className="mt-3 text-gray-400 text-sm sm:text-base">
        Sign in your account
      </p>

      <form className="mt-10 space-y-6">

        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Your Email
          </label>

          <input
            type="email"
            value="info.madhu786@gmail.com"
            className="w-full h-14 border border-gray-300 rounded-xl px-5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>

          <div className="relative">
            <input
              type="password"
              value="password"
              className="w-full h-14 border border-gray-300 rounded-xl px-5 pr-14 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-black"
            />

            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="rounded border-gray-300"
            />
            Remember Me
          </label>

          <a
            href="#"
            className="text-sm text-gray-400 hover:text-black"
          >
            Forgot Password?
          </a>
        </div>

        <button
          className="w-full h-14 bg-[#1b1b1b] text-white rounded-xl text-base font-semibold hover:bg-black transition"
        >
          Login
        </button>
      </form>



      <p className="text-center text-gray-400 text-sm mt-12">
        Do you already have an account ?
        <Link to='/login'>
          <span className="text-blue-600 font-medium">
            {' '}Login
          </span>
        </Link>
      </p>
    </div>
  </AuthLayout>
}
