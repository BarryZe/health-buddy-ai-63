import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, Flame, Clock } from "lucide-react";

const Progress = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const { data: workouts } = useQuery({
    queryKey: ['all-workouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('completed_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: healthMetrics } = useQuery({
    queryKey: ['all-health-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .order('recorded_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const chartData = workouts?.map(w => ({
    date: new Date(w.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    calories: w.calories_burned || 0,
    duration: w.duration_minutes || 0,
  })) || [];

  const totalWorkouts = workouts?.length || 0;
  const totalCalories = workouts?.reduce((sum, w) => sum + (w.calories_burned || 0), 0) || 0;
  const totalMinutes = workouts?.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) || 0;
  const avgCalories = totalWorkouts > 0 ? Math.round(totalCalories / totalWorkouts) : 0;

  const stats = [
    {
      title: "Total Workouts",
      value: totalWorkouts,
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Avg Calories",
      value: avgCalories,
      icon: Flame,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Total Minutes",
      value: totalMinutes,
      icon: Clock,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "This Month",
      value: workouts?.filter(w => {
        const workoutDate = new Date(w.completed_at);
        const now = new Date();
        return workoutDate.getMonth() === now.getMonth() &&
               workoutDate.getFullYear() === now.getFullYear();
      }).length || 0,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Your Progress</h2>
          <p className="text-muted-foreground">Track your fitness journey</p>
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

        {chartData.length > 0 && (
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Calories Burned</CardTitle>
              <CardDescription>Your workout intensity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="calories" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>Workout Duration</CardTitle>
            <CardDescription>Time spent training</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="duration" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--secondary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Start logging workouts to see your progress!
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>Health Metrics</CardTitle>
            <CardDescription>Data from Apple Health</CardDescription>
          </CardHeader>
          <CardContent>
            {healthMetrics && healthMetrics.length > 0 ? (
              <div className="space-y-2">
                {healthMetrics.slice(0, 5).map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
                  >
                    <div>
                      <p className="font-medium capitalize">{metric.metric_type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(metric.recorded_at).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-lg font-bold">
                      {metric.value} {metric.unit}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Connect Apple Health to sync your data
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Progress;