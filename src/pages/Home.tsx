import { useEffect, useState } from "react";
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Flame, Heart } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
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

  // Prepare radar chart data from healthMetrics, fallback to demo data if empty
  const radarData = (healthMetrics || [])
    .filter(m => ["heart_rate", "sleep_hours", "steps", "stress_level", "hydration"].includes(m.metric_type))
    .map(m => ({
      metric: m.metric_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: Number(m.value)
    }));

  const demoRadarData = [
    { metric: "Heart Rate", value: 72 },
    { metric: "Sleep Hours", value: 75 },
    { metric: "Steps", value: 90 },
    { metric: "Stress Level", value: 70 },
    { metric: "Hydration", value: 80 },
  ];

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
   <div className="flex flex-wrap lg:flex-nowrap items-start justify-between gap-4">
          <div className="flex-1">
            {/* Avatar next to name, with the green ball moved under the text */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground">
                {user.user_metadata?.name?.charAt(0).toUpperCase() || 'A'}
              </div>

              <div className="flex-1">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    Welcome back, {user.user_metadata?.name || 'Athlete'}! 👋
                  </h2>
                  <p className="text-muted-foreground">Here's your fitness overview</p>
                </div>

                <div className="w-80 h-80 mt-3">
                  <Canvas style={{ width: '100%', height: '100%' }} camera={{ position: [0, 0, 4] }} shadows>
                    {/* Background color for the scene */}
                    {/* <color attach="background" args={['#f0f0f0']} /> Set to grey */}

                    {/* Ambient + hemisphere for soft overall light */}
                    <ambientLight intensity={0.4} />
                    {/* <hemisphereLight skyColor="#a8e6cf" groundColor="green" intensity={0.35} /> Set sky color to light green */}

                    {/* Fill point lights to give depth and rim light */}
                    <pointLight position={[-3, 2, 4]} intensity={0.6} color="#60a5fa" />
                    <pointLight position={[3, 2, 4]} intensity={0.5} color="#fb7185" />
                    <pointLight position={[0, -4, -2]} intensity={0.25} color="#a78bfa" />

                    {/* Existing directional/spot lights can remain but reduce overlap */}
                    <directionalLight position={[0, 5, 2]} intensity={0.6} />
                    <spotLight position={[0, 6, 0]} intensity={0.5} angle={0.4} penumbra={0.6} />

                    {/* Head */}
                    <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
                      <sphereGeometry args={[0.5, 32, 32]} />
                      <meshStandardMaterial
                        color="#ffffff"
                        emissive="#8b5cf6"
                        emissiveIntensity={0.25}
                        metalness={0.35}
                        roughness={0.35}
                      />
                    </mesh>

                    {/* Body */}
                    <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
                      <sphereGeometry args={[0.5, 32, 32]} />
                      <meshStandardMaterial
                        color="cyan"
                        emissive="#065f46"
                        emissiveIntensity={0.12}
                        metalness={0.25}
                        roughness={0.35}
                      />
                    </mesh>

                    {/* Ears */}
                    <mesh position={[-0.35, 0.75, 0]}>
                      <sphereGeometry args={[0.15, 16, 16]} />
                      <meshStandardMaterial color="cyan" />
                    </mesh>
                    <mesh position={[0.35, 0.75, 0]}>
                      <sphereGeometry args={[0.15, 16, 16]} />
                      <meshStandardMaterial color="cyan" />
                    </mesh>

                    {/* Eyes */}
                    <mesh position={[-0.15, 0.45, 0.48]}>
                      <sphereGeometry args={[0.1, 16, 16]} />
                      <meshStandardMaterial color="#000000" />
                    </mesh>
                    <mesh position={[0.15, 0.45, 0.48]}>
                      <sphereGeometry args={[0.1, 16, 16]} />
                      <meshStandardMaterial color="#000000" />
                    </mesh>

                    {/* Subtle ground plane to catch light / reflection
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]} receiveShadow>
                      <planeGeometry args={[10, 10]} />
                      <meshStandardMaterial color="#071022" roughness={1} metalness={0} />
                    </mesh> */}

                    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={4} />
                  </Canvas>

                </div>
              </div>
            </div>
          </div>
         <div className="w-full lg:w-1/3 h-96">
    <Card className="bg-gradient-card border-border h-full">
      <CardHeader>
        <CardTitle>Health Radar</CardTitle>
        <CardDescription>Your metrics snapshot</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData.length ? radarData : demoRadarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <Radar name="Metrics" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
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