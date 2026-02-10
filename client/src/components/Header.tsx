import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { LogOut, Settings, LayoutDashboard, History, Plus, ShieldCheck } from "lucide-react";
import { ManualEntryDialog } from "./ManualEntryDialog";

export function Header() {
    const { user, logout, isAuthenticated } = useAuth();
    const [location] = useLocation();

    if (!isAuthenticated) return null;

    return (
        <header className="border-b border-border bg-card sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/">
                        <div className="flex items-center gap-3 cursor-pointer group">
                            <img
                                src="/logo.png"
                                alt="Hill Days Logo"
                                className="w-12 h-12 object-contain transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                            />
                            <h1 className="text-2xl font-black tracking-tighter hidden sm:block">
                                Hill Days
                            </h1>
                        </div>
                    </Link>

                    <nav className="flex items-center gap-1 md:gap-2">
                        <Link href="/">
                            <Button
                                variant={location === "/" ? "secondary" : "ghost"}
                                size="sm"
                                className="gap-2 px-2 md:px-3"
                                title="Dashboard"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span className="hidden md:inline">Dashboard</span>
                            </Button>
                        </Link>

                        <Link href="/history">
                            <Button
                                variant={location === "/history" ? "secondary" : "ghost"}
                                size="sm"
                                className="gap-2 px-2 md:px-3"
                                title="History"
                            >
                                <History className="w-4 h-4" />
                                <span className="hidden md:inline">History</span>
                            </Button>
                        </Link>

                        <Link href="/settings">
                            <Button
                                variant={location === "/settings" ? "secondary" : "ghost"}
                                size="sm"
                                className="gap-2 px-2 md:px-3"
                                title="Settings"
                            >
                                <Settings className="w-4 h-4" />
                                <span className="hidden md:inline">Settings</span>
                            </Button>
                        </Link>

                        {user?.role === 'admin' && (
                            <Link href="/admin">
                                <Button
                                    variant={location === "/admin" ? "secondary" : "ghost"}
                                    size="sm"
                                    className="gap-2 px-2 md:px-3"
                                    title="Admin Panel"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="hidden md:inline">Admin</span>
                                </Button>
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden lg:flex flex-col items-end mr-2">
                        <span className="text-sm font-medium leading-none">{user?.name}</span>
                        {user?.role === 'admin' && (
                            <span className="text-[10px] text-accent font-bold uppercase tracking-wider mt-1">Admin</span>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <ManualEntryDialog trigger={
                            <Button variant="default" size="sm" className="h-9 gap-2 px-3 bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add Hill Day</span>
                            </Button>
                        } />

                        <Button variant="ghost" size="icon" onClick={() => logout()} title="Sign Out">
                            <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive transition-colors" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
