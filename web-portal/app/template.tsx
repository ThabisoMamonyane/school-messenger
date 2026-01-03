'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        setAnimationClass('page-enter');
        const timer = setTimeout(() => {
            setAnimationClass('');
        }, 500);
        return () => clearTimeout(timer);
    }, [pathname]);

    return (
        <div className={animationClass} style={{ height: '100%', width: '100%' }}>
            {children}
        </div>
    );
}
