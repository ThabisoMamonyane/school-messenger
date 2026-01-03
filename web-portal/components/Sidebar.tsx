'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useRef } from 'react';
import styles from './Sidebar.module.css';
import { useSchool } from '@/context/SchoolContext';

// Icon Components
const Icons = {
    Home: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
    ),
    Message: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    ),
    Calendar: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
    ),
    Events: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
        </svg>
    ),
    Groups: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
    ),
    Announcements: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
    ), // Using Shield icon as placeholder for Announcements/Notice
    Bell: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
    ),
    Logout: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
    ),
    Staff: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <polyline points="17 11 19 13 23 9"></polyline>
        </svg>
    ),
    School: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
        </svg>
    ),
    Profile: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
    ),
    Settings: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    ),
    Support: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
        </svg>
    ),
    Shield: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
    ),
    ChevronDown: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    ),
    Check: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    )
};

export default function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<string>('');
    const [isAppAdmin, setIsAppAdmin] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { schools, selectedSchool, selectedRole, setSelectedSchoolId, loading: schoolsLoading } = useSchool();

    // Use selectedRole from context for menu logic
    const currentRole = selectedRole || role;

    useEffect(() => {
        const getUserAndRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch Profile for is_app_admin
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_app_admin')
                    .eq('id', user.id)
                    .single();

                if (profile?.is_app_admin) {
                    setIsAppAdmin(true);
                }

                // If we have schools, the context will handle the role.
                // Otherwise, we fetch a default role for the sidebar header.
                if (schools.length > 0) {
                    // Context handles chosen school role
                    setRole(selectedRole);
                } else {
                    const { data } = await supabase
                        .from('school_members')
                        .select('role')
                        .eq('user_id', user.id);

                    if (data && data.length > 0) {
                        const roles = data.map(r => r.role);
                        if (roles.includes('admin')) setRole('admin');
                        else if (roles.includes('communications_officer')) setRole('communications_officer');
                        else if (roles.includes('teacher')) setRole('teacher');
                        else setRole(roles[0]);
                    }
                }
            }
        };
        getUserAndRole();
    }, [schools, selectedRole]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSchoolSelect = (schoolId: string) => {
        setSelectedSchoolId(schoolId);
        setDropdownOpen(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const isStaff = ['admin', 'teacher', 'communications_officer'].includes(currentRole);
    const isFullAdmin = ['admin', 'communications_officer'].includes(currentRole);

    const menuSections = [
        {
            title: 'Main',
            items: [
                { name: 'Home', href: '/dashboard', icon: <Icons.Home /> },
                { name: 'My Schools', href: '/dashboard/myschools', icon: <Icons.School /> },
                { name: 'Find Schools', href: '/dashboard/find-schools', icon: <Icons.Events /> },
                { name: 'Messages', href: '/dashboard/messages', icon: <Icons.Message /> },
                { name: 'Calendar', href: '/dashboard/calendar', icon: <Icons.Calendar /> },
                { name: 'Account Settings', href: '/dashboard/account', icon: <Icons.Settings /> },
            ]
        }
    ];

    // Staff-specific sections (Teachers, Admins, etc.)
    if (isStaff) {
        menuSections.push({
            title: 'Academic',
            items: [
                { name: 'Groups', href: '/dashboard/groups', icon: <Icons.Groups /> },
                { name: 'Announcements', href: '/dashboard/announcements', icon: <Icons.Announcements /> },
            ]
        });
    } else if (currentRole === 'parent') {
        // Parents view academic things differently (or maybe just the same links but restricted pages)
        // For now, let's keep it simple: if they are a parent, they still see these but with "view" intent
        menuSections.push({
            title: 'Academic',
            items: [
                { name: 'Groups', href: '/dashboard/groups', icon: <Icons.Groups /> },
                { name: 'Announcements', href: '/dashboard/announcements', icon: <Icons.Announcements /> },
            ]
        });
    }

    // Full Admin Management
    if (isFullAdmin) {
        menuSections.push({
            title: 'Management',
            items: [
                { name: 'Manage Staff', href: '/dashboard/staff', icon: <Icons.Staff /> },
                { name: 'School Profile', href: '/dashboard/school-profile', icon: <Icons.Profile /> },
            ]
        });
    }

    // Platform Management (Super Admin)
    if (isAppAdmin) {
        menuSections.push({
            title: 'Platform Management',
            items: [
                { name: 'Admin Dashboard', href: '/dashboard/admin', icon: <Icons.Shield /> },
            ]
        });
    }

    // Help & Policy
    menuSections.push({
        title: 'Help',
        items: [
            { name: 'Support', href: '/dashboard/support', icon: <Icons.Support /> },
            { name: 'Privacy Policy', href: '/dashboard/privacy', icon: <Icons.Shield /> },
        ]
    });

    return (
        <aside className={styles.sidebar}>
            {/* User Profile Header */}
            <div className={styles.userProfile}>
                {user ? (
                    <>
                        <div className={styles.avatar}>
                            {user.email?.[0].toUpperCase()}
                        </div>
                        <div className={styles.userInfo}>
                            <h3 className={styles.userName}>{user.user_metadata?.full_name}</h3>
                            <span className={styles.userRole}>
                                {currentRole
                                    ? currentRole.charAt(0).toUpperCase() + currentRole.slice(1).replace('_', ' ')
                                    : 'User'}
                            </span>
                        </div>
                        <button className={styles.notificationBtn}>
                            <Icons.Bell />
                        </button>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', paddingBottom: 6 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
                        <div style={{ flex: 1 }}>
                            <div style={{ width: '80%', height: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 8 }}></div>
                            <div style={{ width: '50%', height: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* School Switcher */}
            {schools.length > 0 && (
                <div className={styles.schoolSwitcher}>
                    <span className={styles.schoolSwitcherLabel}>Current School</span>
                    <div className={styles.dropdownWrapper} ref={dropdownRef}>
                        <button
                            className={styles.schoolDropdownTrigger}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                            <div className={styles.schoolAvatar}>
                                {selectedSchool?.avatar_url ? (
                                    <img src={selectedSchool.avatar_url} alt={selectedSchool.name} />
                                ) : (
                                    selectedSchool?.name?.[0] || '?'
                                )}
                            </div>
                            <div className={styles.schoolInfo}>
                                <div className={styles.schoolName}>
                                    {selectedSchool?.name || 'Select School'}
                                </div>
                                <div className={styles.schoolRole}>
                                    {selectedRole ? selectedRole.replace('_', ' ') : ''}
                                </div>
                            </div>
                            <span className={`${styles.dropdownArrow} ${dropdownOpen ? styles.open : ''}`}>
                                <Icons.ChevronDown />
                            </span>
                        </button>

                        {dropdownOpen && schools.length > 1 && (
                            <div className={styles.schoolDropdownMenu}>
                                {schools.map((membership) => (
                                    <button
                                        key={membership.school.id}
                                        className={`${styles.schoolOption} ${selectedSchool?.id === membership.school.id ? styles.selected : ''}`}
                                        onClick={() => handleSchoolSelect(membership.school.id)}
                                    >
                                        <div className={styles.schoolOptionAvatar}>
                                            {membership.school.avatar_url ? (
                                                <img src={membership.school.avatar_url} alt={membership.school.name} />
                                            ) : (
                                                membership.school.name[0]
                                            )}
                                        </div>
                                        <div className={styles.schoolOptionInfo}>
                                            <div className={styles.schoolOptionName}>{membership.school.name}</div>
                                            <div className={styles.schoolOptionRole}>{membership.role.replace('_', ' ')}</div>
                                        </div>
                                        {selectedSchool?.id === membership.school.id && (
                                            <span className={styles.checkMark}><Icons.Check /></span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className={styles.scrollContent}>
                {menuSections.map((section, idx) => (
                    <div key={idx} className={styles.menuSection}>
                        <h4 className={styles.sectionTitle}>{section.title}</h4>
                        <nav className={styles.nav}>
                            {section.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                    >
                                        <span className={styles.icon}>{item.icon}</span>
                                        <span className={styles.name}>{item.name}</span>
                                        {isActive && <div className={styles.activeIndicator}></div>}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                ))}
            </div>

            <div className={styles.footer}>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                    <span className={styles.icon}><Icons.Logout /></span>
                    <span className={styles.name}>Logout</span>
                </button>
            </div>
        </aside>
    );
}
