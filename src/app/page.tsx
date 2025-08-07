import AuthForm from '@/components/AuthForm';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Welcome to ContextWise</h1>
      <AuthForm />
    </main>
  );
}