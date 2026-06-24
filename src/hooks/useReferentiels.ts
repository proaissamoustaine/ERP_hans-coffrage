import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { fetchTable } from './referentiels.fetch';

const STALE = 60 * 60 * 1000; // 1 hour

export function useCatalogue() {
  return useQuery({
    queryKey: ['ref', 'catalogue_matieres'],
    queryFn: () => fetchTable(supabase, 'catalogue_matieres'),
    staleTime: STALE,
  });
}

export function useTauxMO() {
  return useQuery({
    queryKey: ['ref', 'taux_horaires_mo'],
    queryFn: () => fetchTable(supabase, 'taux_horaires_mo'),
    staleTime: STALE,
  });
}

export function useTachesCodes() {
  return useQuery({
    queryKey: ['ref', 'taches_codes'],
    queryFn: () => fetchTable(supabase, 'taches_codes'),
    staleTime: STALE,
  });
}

export function useCategoriesHeures() {
  return useQuery({
    queryKey: ['ref', 'categories_heures'],
    queryFn: () => fetchTable(supabase, 'categories_heures'),
    staleTime: STALE,
  });
}

export function useParametres() {
  return useQuery({
    queryKey: ['ref', 'parametres'],
    queryFn: () => fetchTable(supabase, 'parametres'),
    staleTime: STALE,
  });
}

export function useTypesDebit() {
  return useQuery({
    queryKey: ['ref', 'types_debit'],
    queryFn: () => fetchTable(supabase, 'types_debit'),
    staleTime: STALE,
  });
}

export function useMachines() {
  return useQuery({
    queryKey: ['ref', 'machines'],
    queryFn: () => fetchTable(supabase, 'machines'),
    staleTime: STALE,
  });
}
