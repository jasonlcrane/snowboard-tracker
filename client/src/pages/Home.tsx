import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart3, Settings, LogOut } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-card">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div>
              <h1 className="text-5xl font-bold tracking-tight mb-4">
                Carter's Badge-In Tracker
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Track snowboarding visits, analyze trends, and project season totals with real-time weather integration
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-12">
              <Card>
                <CardHeader>
                  <BarChart3 className="w-8 h-8 text-accent mb-2" />
                  <CardTitle className="text-lg">Real-Time Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View daily, weekly, and seasonal badge-in statistics with interactive charts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="w-8 h-8 text-accent mb-2" />
                  <CardTitle className="text-lg">Smart Projections</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Get Conservative, Average, and Optimistic season-end projections based on current trends
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="w-8 h-8 text-accent mb-2" />
                  <CardTitle className="text-lg">Weather Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Automatic forecasts adjust projections based on upcoming weather patterns
                  </p>
                </CardContent>
              </Card>
            </div>

            <Button asChild size="lg" className="text-base h-12">
              <a href={getLoginUrl()}>Sign In to Get Started</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Carter's Badge-In Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">Welcome, {user?.name?.split(' ')[0]}</h2>
            <p className="text-lg text-muted-foreground">
              Track your snowboarding season and get insights into your visit patterns
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <Link href="/dashboard">
              <Card className="cursor-pointer hover:border-accent transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Dashboard
                  </CardTitle>
                  <CardDescription>View your season statistics and projections</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    See real-time badge-in data, weekly breakdowns, and projected season totals
                  </p>
                </CardContent>
              </Card>
            </Link>

            {user?.role === 'admin' && (
              <Link href="/admin">
                <Card className="cursor-pointer hover:border-accent transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Admin Panel
                    </CardTitle>
                    <CardDescription>Manage account and scraping settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Configure credentials, view scraping logs, and trigger manual updates
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>

          <Card className="bg-card/50 border-border/50 mt-12">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Connect Your Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Set up your Three Rivers Parks credentials in the Admin Panel (secure encryption)
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Automatic Scraping</h4>
                  <p className="text-sm text-muted-foreground">
                    Daily automated scrapes fetch your latest badge-in data from the Parks system
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Real-Time Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    View your statistics and get updated projections based on current trends and weather
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
