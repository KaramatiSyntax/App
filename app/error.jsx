'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';

export default function Error({ error, reset }) {
  // Parse error.message if it's a JSON string
  const parsedError = useMemo(() => {
    try {
      return typeof error.message === 'string'
        ? JSON.parse(error.message)
        : error.message;
    } catch {
      return { message: error.message || 'An unexpected error occurred' };
    }
  }, [error]);

  return (
    <div className="absolute h-full w-full min-h-screen top-0 left-0 flex flex-col items-center justify-center px-[5vw] py-[8vw] text-center text-neutral-900 dark:text-white
     overflow-hidden transition-all duration-300 ease-in-out bg-[#f7e1e1] dark:bg-[#120101]">
      {/* Blurred red balls for background */}
      <div className="absolute left-10 top-10 w-[30vmin] h-[30vmin] rounded-full blur-[6rem]
      bg-red-700" />
      <div className="absolute
      bottom-10 right-10 w-[30vmin] h-[30vmin] rounded-full blur-[6rem] bg-red-600" />

      <div className="w-full max-w-[420px] flex flex-col items-center">
        <div className="w-[40vw] max-w-[180px] aspect-square mx-auto relative mb-6">
          <Image
            src={parsedError.status === 404 ? "/space.png" : "/planet.png"}
            alt={parsedError.status === 404 ? "Not Found" : "Error"}
            fill
            className="object-contain drop-shadow-[0_0_40px_rgba(239,68,68,0.7)]"
            sizes="(max-width: 600px) 60vw, 180px"
          />
        </div>
        <h3 className="text-2xl font-bold mt-2 text-red-700 dark:text-red-200 drop-shadow">
          {parsedError.status === 404 ? "Not Found" : "Something Went Wrong"}
        </h3>
        <p className="text-red-800 dark:text-red-100 text-base mt-3 drop-shadow">
          {parsedError.message ||
            (parsedError.status === 404
              ? "The requested resource could not be found."
              : "An unexpected error occurred. Please try again later.")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-10 w-full max-w-[320px] mx-auto">
          <button
            onClick={() => reset()}
            className="flex-1 px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-red-300 transition text-sm font-medium outline-none shadow shadow-red-400/40 dark:bg-red-600 dark:hover:bg-red-700"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 px-4 py-2 rounded-md bg-red-200/60 hover:bg-red-300/80 focus-visible:ring-2 focus-visible:ring-red-300 transition text-sm font-medium text-neutral-900 dark:text-white outline-none text-center shadow shadow-red-400/20 dark:bg-red-400/30 dark:hover:bg-red-400/50"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}