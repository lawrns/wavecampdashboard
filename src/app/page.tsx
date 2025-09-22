import { redirect } from 'next/navigation';

export default function HomePage() {
  // Temporarily disabled redirect for WordPress testing
  // redirect('/admin');
  return <div>Welcome to Heiwa House</div>;
}
