'use server';

import type { Driver, Vehicle } from './types';

export async function getAssignmentSuggestions(drivers: Driver[], vehicles: Vehicle[]) {
  try {
    // AI functionality is temporarily removed to resolve dependency conflicts.
    // This function now returns an empty array.
    console.log('getAssignmentSuggestions called, but AI is disabled. Returning empty array.');
    return { suggestions: [] };
  } catch (e) {
    console.error(e);
    return { suggestions: [], error: 'An unexpected error occurred. Please try again.' };
  }
}
