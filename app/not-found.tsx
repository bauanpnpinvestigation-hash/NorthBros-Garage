import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-24 text-center space-y-6">
      <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#6E6E68]">
        Error 404
      </p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141413]">
        Part or Page Not Found
      </h1>
      <p className="text-sm text-[#6E6E68] max-w-md mx-auto">
        The automotive component, workshop service, or page you were searching for does not exist or has been relocated.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/parts"
          className="px-5 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800"
        >
          Explore Parts Catalog
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 bg-white border border-[#E5E5E0] text-[#141413] text-xs font-semibold rounded-lg hover:bg-neutral-50"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
