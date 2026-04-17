import IconBar from '@/components/layout/IconBar';
import LeftPanel from '@/components/layout/LeftPanel';
import RightPanel from '@/components/layout/RightPanel';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background" data-testid="main-layout">
      <IconBar />
      <LeftPanel />

      {/* Main content area: offset by icon bar (72px) on all sizes, plus left panel (280px) and right panel (340px) on xl */}
      <main className="ml-[72px] min-h-screen xl:ml-[352px] xl:mr-[340px]">
        {children}
      </main>

      <RightPanel />
    </div>
  );
}
