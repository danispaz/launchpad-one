import { Outlet, Link, createRootRoute, HeadContent, Scripts, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LaunchHub — Painel de lançamentos de produto" },
      { name: "description", content: "A fonte única da verdade para coordenar lançamentos entre Marketing, Vendas, Dev, Produto e Diretoria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "LaunchHub — Painel de lançamentos de produto" },
      { name: "twitter:title", content: "LaunchHub — Painel de lançamentos de produto" },
      { property: "og:description", content: "A fonte única da verdade para coordenar lançamentos entre Marketing, Vendas, Dev, Produto e Diretoria." },
      { name: "twitter:description", content: "A fonte única da verdade para coordenar lançamentos entre Marketing, Vendas, Dev, Produto e Diretoria." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9cca7194-c815-4227-833b-0c398cf26b5f/id-preview-b01acf36--b85004d3-de1e-42b4-a6d7-64a79cfb0d72.lovable.app-1778727659322.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9cca7194-c815-4227-833b-0c398cf26b5f/id-preview-b01acf36--b85004d3-de1e-42b4-a6d7-64a79cfb0d72.lovable.app-1778727659322.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user && location.pathname !== "/login") {
      const searchString = (location.search && Object.keys(location.search).length > 0)
        ? "?" + new URLSearchParams(location.search as Record<string, string>).toString()
        : "";
      
      const fullPath = location.pathname + searchString;
      
      navigate({ 
        to: "/login", 
        search: { redirect: fullPath }
      });
    }
  }, [user, loading, navigate, location.pathname, JSON.stringify(location.search)]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
