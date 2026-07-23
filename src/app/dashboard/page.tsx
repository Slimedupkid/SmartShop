import { createClient } from '@/core/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Failsafe: Middleware handles this, but server components should also be secure.
  if (!user) {
    redirect('/login');
  }

  // Inline server action for simple logout
  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <form action={signOut}>
            <Button variant="outline" type="submit">Sign out</Button>
          </form>
        </div>
        <div className="mt-8">
          <p className="text-gray-600">
            Welcome to SmartShop. You are securely logged in as <strong>{user.email}</strong>.
          </p>
          <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
            [Milestone 3: Shopping Lists & Baskets will render here]
          </div>
        </div>
      </div>
    </div>
  );
}