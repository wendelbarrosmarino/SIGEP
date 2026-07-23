import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { headers } from 'next/headers';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers();
  const role = headersList.get('x-user-role') || 'EMPLOYEE';

  return (
    <div className="app-layout">
      <Sidebar role={role as 'RT' | 'EMPLOYEE'} />
      <div className="app-content">
        <TopBar />
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
