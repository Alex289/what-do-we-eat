import Link from 'next/link';
import Image from 'next/image';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <nav className="text-gray-900 navbar bg-gray-50 md:my-4 dark:bg-gray-800 dark:text-gray-100">
      <div className="flex-1">
        <h1 className="text-xl text-gray-900 normal-case btn btn-ghost dark:text-gray-100 sm:ml-4">
          <Link href="/">What do we eat?</Link>
        </h1>
      </div>
      <div className="flex-none">
        <button
          aria-label="Toggle Dark Mode"
          type="button"
          className="w-10 h-10 p-3 mr-1 bg-gray-200 rounded-lg dark:bg-gray-700 md:mr-3 ring-gray-300 hover:ring-4"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
          {mounted && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              className="w-4 h-4 text-gray-800 dark:text-gray-200">
              {resolvedTheme === 'dark' ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              )}
            </svg>
          )}
        </button>

        {!session?.user && (
          <button
            className="ml-1 normal-case btn btn-primary"
            onClick={() => signIn('google')}>
            Sign in
          </button>
        )}

        {session?.user && (
          <div className="ml-1 dropdown dropdown-end sm:mr-4">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10">
                {session.user.image && (
                  <Image
                    alt="profile picture"
                    src={session.user.image}
                    layout="fill"
                    className="rounded-full"
                  />
                )}
              </div>
            </label>
            <ul
              tabIndex={0}
              className="p-2 mt-3 bg-white shadow menu menu-compact dropdown-content dark:bg-gray-700 rounded-box w-52">
              <li>
                <div className="justify-between">{session.user.name}</div>
              </li>
              <>
                {session.isAdmin && (
                  <li>
                    <Link href="/dashboard">Dashboard</Link>
                  </li>
                )}
              </>
              <li>
                <div onClick={() => signOut()}>Logout</div>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
