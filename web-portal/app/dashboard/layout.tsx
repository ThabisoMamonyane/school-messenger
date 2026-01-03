'use client';

import Sidebar from '@/components/Sidebar';
import { SchoolProvider } from '@/context/SchoolContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SchoolProvider>
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main style={{
                    flex: 1,
                    marginLeft: '280px',
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #e0f2fe 0%, #f1f5f9 100%)',
                    padding: '40px',
                    position: 'relative'
                }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        {children}
                    </div>
                </main>
            </div>
        </SchoolProvider>
    );
}
