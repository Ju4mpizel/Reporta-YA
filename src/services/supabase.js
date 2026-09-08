// [TI-07] Módulo singleton: exporta el cliente autenticado de Supabase.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://TU_PROYECTO.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "TU_ANON_KEY";

if (
  SUPABASE_URL.includes("TU_PROYECTO") ||
  SUPABASE_ANON_KEY.includes("TU_ANON_KEY")
) {
  console.warn(
    "⚠️ Supabase no configurado: crea el archivo .env con " +
      "EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});