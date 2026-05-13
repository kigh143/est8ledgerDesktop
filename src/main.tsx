import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen.ts';
import { ToastContainer } from 'react-toastify';

const router = createRouter({routeTree});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const App = () => {
  return <>
    <RouterProvider router={router} />
    <ToastContainer />
  </>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
