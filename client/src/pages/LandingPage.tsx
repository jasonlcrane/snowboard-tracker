import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-card flex items-center justify-center">
            <div className="container mx-auto px-4 py-20">
                <div className="max-w-2xl mx-auto text-center space-y-8">
                    <div>
                        <h1 className="text-6xl font-black tracking-tighter mb-4">
                            Hill Days
                        </h1>
                        <p className="text-xl text-muted-foreground mb-8">
                            Track snowboarding visits, analyze trends, and project season totals with real-time weather integration
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-12">
                        <Card>
                            <CardHeader>
                                <BarChart3 className="w-8 h-8 text-accent mb-2 mx-auto" />
                                <CardTitle className="text-lg">Real-Time Analytics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    View daily, weekly, and seasonal hill statistics with interactive charts
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <BarChart3 className="w-8 h-8 text-accent mb-2 mx-auto" />
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
                                <BarChart3 className="w-8 h-8 text-accent mb-2 mx-auto" />
                                <CardTitle className="text-lg">Weather Integration</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Automatic forecasts adjust projections based on upcoming weather patterns
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Button asChild size="lg" className="text-base h-12 shadow-xl hover:shadow-2xl transition-all">
                        <a href={getLoginUrl()}>Sign In to Get Started</a>
                    </Button>
                </div>
            </div>
        </div>
    );
}
