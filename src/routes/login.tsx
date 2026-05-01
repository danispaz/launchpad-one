import { createFileRoute, useNavigate, useSearch, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Zap, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || "/",
    };
  },
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();
  const search = useSearch({ from: "/login" });
  const { user, loading: authLoading } = useAuth();

  const handleRedirect = useCallback(() => {
    const redirectUrl = (search as any).redirect || "/";
    // Using router.history.push to handle strings that might contain query params
    router.history.push(redirectUrl);
  }, [router, search]);

  useEffect(() => {
    if (!authLoading && user) {
      handleRedirect();
    }
  }, [user, authLoading, handleRedirect]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success("Bem-vindo ao LaunchHub!");
      navigate({ to: (search as any).redirect || "/" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast.error("Digite seu e-mail para receber o link");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      toast.success("Link mágico enviado para seu e-mail!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar link");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FBFBFA] relative overflow-hidden">
      {/* Subtle Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />

      <div className="w-full max-w-md px-8 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Zap className="text-white w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">LaunchHub</h1>
          <p className="text-muted-foreground mt-2 text-center">
            A fonte única da verdade para seus lançamentos.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="email">
                E-mail profissional
              </label>
              <input
                id="email"
                type="email"
                placeholder="nome@empresa.com"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Ou continue com</span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-2 h-10 px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              onClick={handleMagicLink}
            >
              <Mail className="w-4 h-4" />
              Link Mágico
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Não tem uma conta? <span className="text-primary font-medium cursor-pointer hover:underline">Entre em contato com seu admin</span>
        </p>
      </div>
    </div>
  );
}

