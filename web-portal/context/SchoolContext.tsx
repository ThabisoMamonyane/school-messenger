'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface School {
    id: string;
    name: string;
    address: string;
    province: string;
    avatar_url?: string;
    status?: string;
}

interface SchoolMembership {
    id: string;
    role: string;
    school: School;
}

interface SchoolContextType {
    schools: SchoolMembership[];
    selectedSchool: School | null;
    selectedRole: string;
    setSelectedSchoolId: (schoolId: string) => void;
    loading: boolean;
    refreshSchools: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
    const [schools, setSchools] = useState<SchoolMembership[]>([]);
    const [selectedSchoolId, setSelectedSchoolIdState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSchools = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('school_members')
                .select(`
                    id,
                    role,
                    schools (
                        id,
                        name,
                        address,
                        province,
                        avatar_url,
                        status,
                        contact_info
                    )
                `)
                .eq('user_id', user.id);

            if (error) {
                console.error('Error fetching schools:', error);
                setLoading(false);
                return;
            }

            const memberships: SchoolMembership[] = (data || []).map((m: any) => ({
                id: m.id,
                role: m.role,
                school: Array.isArray(m.schools) ? m.schools[0] : m.schools
            })).filter(m => m.school); // Filter out any null schools

            setSchools(memberships);

            // Set default selected school (first one, or from localStorage)
            if (memberships.length > 0) {
                const savedSchoolId = localStorage.getItem('selectedSchoolId');
                const savedSchoolExists = memberships.some(m => m.school.id === savedSchoolId);

                if (savedSchoolId && savedSchoolExists) {
                    setSelectedSchoolIdState(savedSchoolId);
                } else {
                    setSelectedSchoolIdState(memberships[0].school.id);
                }
            }
        } catch (err) {
            console.error('Error in fetchSchools:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchools();
    }, []);

    const setSelectedSchoolId = (schoolId: string) => {
        setSelectedSchoolIdState(schoolId);
        localStorage.setItem('selectedSchoolId', schoolId);
    };

    const selectedMembership = schools.find(m => m.school.id === selectedSchoolId);
    const selectedSchool = selectedMembership?.school || null;
    const selectedRole = selectedMembership?.role || '';

    return (
        <SchoolContext.Provider value={{
            schools,
            selectedSchool,
            selectedRole,
            setSelectedSchoolId,
            loading,
            refreshSchools: fetchSchools
        }}>
            {children}
        </SchoolContext.Provider>
    );
}

export function useSchool() {
    const context = useContext(SchoolContext);
    if (context === undefined) {
        throw new Error('useSchool must be used within a SchoolProvider');
    }
    return context;
}
