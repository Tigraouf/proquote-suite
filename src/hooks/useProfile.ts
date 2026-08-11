import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  trade: string | null;
  legal_form: string | null;
  siret: string | null;
  vat_number: string | null;
  vat_rate: number;
  vat_exempt: boolean;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  iban: string | null;
  hourly_rate: number | null;
  payment_terms_days: number;
  late_penalty_rate: number;
  recovery_fee: number;
  legal_notes: string | null;

  plan: "free" | "premium";
  plan_cycle: "none" | "monthly" | "yearly";
  plan_renews_at: string | null;
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (error) throw error;
      return data as unknown as Profile | null;
    },
  });
}

export function useIsPremium() {
  const { data } = useProfile();
  return data?.plan === "premium";
}
