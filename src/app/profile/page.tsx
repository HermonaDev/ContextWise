'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserEmail(session.user.email || 'No email');
      } else {
        router.push('/');
      }
    });
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">Profile</h1>
      <p className="text-lg">Email: {userEmail}</p>
      {/* Future: Add user settings, stats, etc. */}
    </main>
  );
}