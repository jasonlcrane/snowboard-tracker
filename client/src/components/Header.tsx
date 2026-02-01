import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { LogOut, Settings, LayoutDashboard } from "lucide-react";

export function Header() {
    const { user, logout, isAuthenticated } = useAuth();
    const [location] = useLocation();

    if (!isAuthenticated) return null;

    return (
        <header className="border-b border-border bg-card sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/">
                        <div className="flex items-center gap-3 cursor-pointer group">
                            <img src="/logo.png" alt="Hill Days Logo" className="w-10 h-10 object-contain transition-transform group-hover:scale-110" />
                            <h1 className="text-2xl font-black tracking-tighter transition-colors group-hover:text-accent">
                                Hill Days
                            </h1>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-4">
                        <Link href="/">
                            <Button
                                variant={location === "/" ? "secondary" : "ghost"}
                                size="sm"
                                className="gap-2"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                Dashboard
                            </Button>
                        </Link>

                        {user?.role === 'admin' && (
                            <Link href="/admin">
                                <Button
                                    variant={location === "/admin" ? "secondary" : "ghost"}
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Settings className="w-4 h-4" />
                                    Admin Panel
                                </Button>
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end mr-2">
                        <span className="text-sm font-medium leading-none">{user?.name}</span>
                        {user?.role === 'admin' && (
                            <span className="text-[10px] text-accent font-bold uppercase tracking-wider mt-1">Admin</span>
                        )}
                    </div>

                    <Button variant="ghost" size="icon" onClick={() => logout()} title="Sign Out">
                        <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive transition-colors" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
