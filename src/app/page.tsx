import { redirect } from 'next/navigation';

export default function Home() {
  // Directly route to the dashboard. 
  // Our middleware will intercept this and redirect to /login if unauthenticated.
  redirect('/dashboard');
}