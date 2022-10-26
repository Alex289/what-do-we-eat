import Router from 'next/router';
import { Inter } from '@next/font/google';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import NProgress from 'nprogress';

import Analytics from '@/components/Analytics';

import type { AppType } from 'next/app';
import type { Session } from 'next-auth';

import '@/styles/global.css';
import 'nprogress/nprogress.css';
import 'react-toastify/dist/ReactToastify.css';

Router.events.on('routeChangeStart', (_url, { shallow }) => {
  NProgress.configure({ showSpinner: false });
  if (!shallow) {
    NProgress.start();
  }
});
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

const normal = Inter();

const App: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class">
        <div className={normal.className}>
          <Analytics />
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
};

export default App;
