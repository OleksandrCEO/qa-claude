import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Moon, Plus, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export function AppHeader() {
  const { signOut, login } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary" />
          <span className="text-sm font-semibold tracking-tight">QA Admin</span>
          {login && <span className="hidden text-xs text-muted-foreground sm:inline">· {login}</span>}
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="h-9 w-9">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => signOut()} aria-label="Logout" className="h-9 w-9">
            <LogOut className="h-4 w-4" />
          </Button>
          <Button onClick={() => navigate({ to: "/new" })} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add New</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
