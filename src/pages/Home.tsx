import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Flame, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: recentWorkouts } = useQuery({
    queryKey: ['recent-workouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: healthMetrics } = useQuery({
    queryKey: ['health-metrics-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const stats = [
    {
      title: "Workouts This Week",
      value: recentWorkouts?.length || 0,
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Calories Burned",
      value: recentWorkouts?.reduce((sum, w) => sum + (w.calories_burned || 0), 0) || 0,
      icon: Flame,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Active Minutes",
      value: recentWorkouts?.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) || 0,
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Heart Rate Avg",
      value: healthMetrics?.find(m => m.metric_type === 'heart_rate')?.value || "--",
      icon: Heart,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user.user_metadata?.name || 'Athlete'}! 👋
          </h2>
          <p className="text-muted-foreground">Here's your fitness overview</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="bg-gradient-card border-border">
                <CardContent className="p-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>Recent Workouts</CardTitle>
            <CardDescription>Your latest training sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentWorkouts && recentWorkouts.length > 0 ? (
              <div className="space-y-3">
                {recentWorkouts.slice(0, 3).map((workout) => (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
                  >
                    <div>
                      <p className="font-medium">{workout.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {workout.duration_minutes} min • {workout.calories_burned || 0} cal
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(workout.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No workouts yet. Start tracking your fitness journey!
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-primary border-0 text-primary-foreground">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-2">💪 Ready to Train?</h3>
            <p className="mb-4 opacity-90">Let's make today count. Start a new workout or check in with your AI coach!</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Home;