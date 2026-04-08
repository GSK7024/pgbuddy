import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "owner" | "tenant" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    try {
      // Auto-link pending staff invitations for this user's email
      const { error: rpcError } = await supabase.rpc("claim_staff_invitation");
      if (rpcError) console.error("RPC claim_staff_invitation error:", rpcError);

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
        
      if (error) {
        console.error("Error fetching user role:", error);
      }
      setRole((data?.role as UserRole) ?? null);
    } catch (err) {
      console.error("Unexpected error in fetchRole:", err);
      setRole(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid potential deadlocks with Supabase auth
          setTimeout(async () => {
            try {
              await fetchRole(session.user.id);
            } finally {
              setLoading(false);
            }
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
        
        // Redirect to reset password page on recovery event
        if (event === "PASSWORD_RECOVERY") {
          window.location.href = "/reset-password";
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          await fetchRole(session.user.id);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
