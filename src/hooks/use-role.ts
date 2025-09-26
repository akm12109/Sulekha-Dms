'use client';
import { useSearchParams } from 'next/navigation';
import type { UserRole } from '@/lib/types';

export function useRole(): UserRole {
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  if (role === 'admin' || role === 'driver' || role === 'parent' || role === 'teacher' || role === 'student') {
    return role;
  }
  
  // Default to a safe role if param is missing or invalid
  return 'admin'; 
}
