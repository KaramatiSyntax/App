'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <main className="w-full h-[90dvh] flex items-center justify-center p-6 text-gray-900 dark:text-white">
      <div className="flex flex-col-reverse md:flex-row items-center justify-center gap-10 w-full max-w-5xl">
        
        {/* Text Section */}
        <motion.div
          className="text-center md:text-left max-w-sm"
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="text-3xl font-bold mb-3 leading-tight">
            404 - Page Not Found
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-300 text-base">
            Sorry, we couldn’t find the page you’re looking for.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Go back home
          </Link>
        </motion.div>

        {/* Image Section */}
        <motion.div
          className="relative w-[60vw] max-w-md aspect-square"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5, 1] }} // blink effect
          transition={{
            duration: 1.2,
            ease: 'easeInOut',
            times: [0, 0.3, 0.6, 1],
          }}
        >
          <Image
            src="/not-found.svg"
            alt="404 Illustration"
            fill
            className="object-contain"
            priority
          />
        </motion.div>
      </div>
    </main>
  );
}
