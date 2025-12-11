import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  Dumbbell,
  TrendingUp,
  Calendar,
  Flame,
  Target,
  Clock,
  ChevronRight,
  PlusCircle,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Plan, WorkoutSession } from "@shared/schema";
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: activePlan, isLoading: plansLoading } = useQuery<Plan>({
    queryKey: ["/api/plans/active"],
  });

  const { data: recentWorkouts, isLoading: workoutsLoading } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/workouts/recent"],
  });

  const { data: stats } = useQuery<{
    totalWorkouts: number;
    thisWeek: number;
    streak: number;
    caloriesBurned: number;
  }>({
    queryKey: ["/api/users/stats"],
  });

  const { data: progressData } = useQuery<{ date: string; weight: number }[]>({
    queryKey: ["/api/progress/chart"],
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
    return {
      date,
      dayName: format(date, "EEE"),
      dayNumber: format(date, "d"),
      isToday: isToday(date),
      hasWorkout: recentWorkouts?.some((w) => isSameDay(new Date(w.date), date)),
    };
  });

  const statCards = [
    {
      title: "Total Workouts",
      value: stats?.totalWorkouts ?? 0,
      icon: Dumbbell,
      color: "text-primary",
    },
    {
      title: "This Week",
      value: stats?.thisWeek ?? 0,
      icon: Calendar,
      color: "text-chart-2",
    },
    {
      title: "Current Streak",
      value: `${stats?.streak ?? 0} days`,
      icon: Flame,
      color: "text-chart-4",
    },
    {
      title: "Calories Burned",
      value: stats?.caloriesBurned?.toLocaleString() ?? 0,
      icon: TrendingUp,
      color: "text-chart-5",
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-welcome">
            Welcome back, {user?.name?.split(" ")[0] || "Athlete"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Link href="/plans/new">
          <Button data-testid="button-generate-plan">
            <PlusCircle className="w-4 h-4 mr-2" />
            Generate New Plan
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(" ", "-")}`}>
                {stat.value}
              </div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Workout Card */}
        <div className="lg:col-span-2">
          {plansLoading ? (
            <Card className="p-8">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ) : activePlan ? (
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary to-chart-2 p-8 text-white">
                <Badge variant="secondary" className="mb-4">
                  Today's Workout
                </Badge>
                <h2 className="text-2xl font-bold mb-2">{activePlan.title}</h2>
                <p className="text-white/80 mb-6">{activePlan.description}</p>
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>45 min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4" />
                    <span>6 exercises</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span className="capitalize">{activePlan.level?.toLowerCase()}</span>
                  </div>
                </div>
                <Link href={`/workout/${activePlan.id}`}>
                  <Button size="lg" variant="secondary" data-testid="button-start-workout">
                    <Play className="w-5 h-5 mr-2" />
                    Start Workout
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Active Plan</h3>
              <p className="text-muted-foreground mb-6">
                Generate a personalized AI workout plan to get started
              </p>
              <Link href="/plans/new">
                <Button data-testid="button-create-first-plan">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Your First Plan
                </Button>
              </Link>
            </Card>
          )}
        </div>

        {/* Weekly Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => (
                <div
                  key={day.dayNumber}
                  className={`text-center p-2 rounded-lg transition-colors ${
                    day.isToday
                      ? "bg-primary text-primary-foreground"
                      : day.hasWorkout
                      ? "bg-chart-2/10"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="text-xs font-medium opacity-70">{day.dayName}</div>
                  <div className="text-lg font-bold">{day.dayNumber}</div>
                  {day.hasWorkout && !day.isToday && (
                    <CheckCircle2 className="w-4 h-4 mx-auto text-chart-2" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Weekly Goal</span>
              <span className="font-medium">{stats?.thisWeek || 0}/5 workouts</span>
            </div>
            <Progress value={((stats?.thisWeek || 0) / 5) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Weight Progress
            </CardTitle>
            <CardDescription>Your weight over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {progressData && progressData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), "MMM d")}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      labelFormatter={(value) => format(new Date(value), "MMMM d, yyyy")}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No progress data yet</p>
                  <Link href="/progress">
                    <Button variant="link" className="mt-2">
                      Log your first progress
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Workouts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Recent Workouts
            </CardTitle>
            <CardDescription>Your latest training sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {workoutsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentWorkouts && recentWorkouts.length > 0 ? (
              <div className="space-y-4">
                {recentWorkouts.slice(0, 5).map((workout) => (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate cursor-pointer"
                    data-testid={`workout-item-${workout.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{workout.notes || "Workout Session"}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(workout.date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    {workout.completed && (
                      <CheckCircle2 className="w-5 h-5 text-chart-2" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No workouts yet</p>
                <p className="text-sm">Complete your first workout to see it here</p>
              </div>
            )}
            {recentWorkouts && recentWorkouts.length > 0 && (
              <Link href="/workouts">
                <Button variant="ghost" className="w-full mt-4" data-testid="button-view-all-workouts">
                  View All Workouts
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
