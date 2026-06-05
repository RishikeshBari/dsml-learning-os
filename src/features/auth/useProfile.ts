import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useProfile() {
  const { user } = useAuth();

  return useQuery<Profile | null>({
    enabled: Boolean(user),
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, timezone, created_at")
        .eq("id", user.id)
        .single();

      if (error) {
        throw error;
      }

      return data as Profile;
    },
  });
}
