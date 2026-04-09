import { redirect } from 'next/navigation';

export default function AdminOnboardPage() {
  // Legacy route — the actual "bring a vendor online" flow is at /admin/shops/new.
  redirect('/admin/shops/new');
}
