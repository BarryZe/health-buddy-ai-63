import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, Heart, Footprints, Zap } from "lucide-react";

const HealthSync = () => {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const syncHealthData = async () => {
    setSyncing(true);
    
    try {
      // This is a placeholder for Apple Health integration
      // In a real iOS app with Capacitor, you would use the HealthKit plugin
      toast({
        title: "Apple Health Integration",
        description: "To sync Apple Health data, this app needs to be built as a native iOS app using Capacitor. Follow the setup instructions in the docs.",
      });

      // Example of what the integration would look like with HealthKit plugin:
      // const { data: healthData } = await CapacitorHealthKit.requestAuthorization({
      //   read: ['steps', 'heartRate', 'calories', 'distance'],
      // });
      // 
      // Then save to Supabase:
      // await supabase.from('health_metrics').insert(healthData);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: error.message,
      });
    } finally {
      setSyncing(false);
    }
  };

  const healthMetrics = [
    {
      name: "Steps",
      icon: Footprints,
      description: "Daily step count",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      name: "Heart Rate",
      icon: Heart,
      description: "Heart rate data",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      name: "Active Energy",
      icon: Zap,
      description: "Calories burned",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      name: "Workouts",
      icon: Activity,
      description: "Exercise sessions",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Apple Health</h2>
          <p className="text-muted-foreground">Sync your health data</p>
        </div>

        <Card className="bg-gradient-primary border-0 text-primary-foreground">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-2">🍎 Connect Apple Health</h3>
            <p className="mb-4 opacity-90">
              Get a complete view of your fitness by syncing data from Apple Health.
            </p>
            <Button
              onClick={syncHealthData}
              disabled={syncing}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              {syncing ? "Syncing..." : "Sync Health Data"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>Available Metrics</CardTitle>
            <CardDescription>Data we can sync from Apple Health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.name}
                  className="flex items-center gap-4 p-3 rounded-lg bg-background/50 border border-border"
                >
                  <div className={`w-12 h-12 rounded-xl ${metric.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="font-medium">{metric.name}</p>
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>How to enable Apple Health sync</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>To sync Apple Health data, this app needs to be built as a native iOS app:</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Export this project to GitHub</li>
              <li>Clone the repository on your Mac</li>
              <li>Run <code className="bg-muted px-2 py-1 rounded">npm install</code></li>
              <li>Add iOS platform: <code className="bg-muted px-2 py-1 rounded">npx cap add ios</code></li>
              <li>Install HealthKit plugin: <code className="bg-muted px-2 py-1 rounded">npm install @capacitor-community/health</code></li>
              <li>Sync: <code className="bg-muted px-2 py-1 rounded">npx cap sync</code></li>
              <li>Open in Xcode: <code className="bg-muted px-2 py-1 rounded">npx cap open ios</code></li>
              <li>Enable HealthKit capability in Xcode</li>
              <li>Build and run on a physical iOS device</li>
            </ol>
            <p className="mt-4">
              Note: Apple Health data can only be accessed on physical iOS devices, not simulators.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HealthSync;