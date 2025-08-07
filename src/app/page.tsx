import { supabase } from '@/lib/supabase';

export default async function Home() {
  const { data, error } = await supabase.from('users').select('*').limit(1);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold">Welcome to ContextWise</h1>
      <p className="mt-4 text-lg">
        {error ? 'Supabase not connected' : 'Supabase connected successfully!'}
      </p>
    </main>
  );
}