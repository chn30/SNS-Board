import { Suspense } from 'react';
import LeftPanel from '@/components/layout/LeftPanel';
import RightPanel from '@/components/layout/RightPanel';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background" data-testid="main-layout">
      <Suspense>
        <LeftPanel />
      </Suspense>

      {/* Main content area: left panel (280px) on xl, right panel (340px) on xl */}
      <main className="min-h-screen xl:ml-[280px] xl:mr-[340px]">
        {children}
      </main>

      <RightPanel />
    </div>
  );
}
