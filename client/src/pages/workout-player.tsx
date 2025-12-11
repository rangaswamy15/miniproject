import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  CheckCircle2,
  Clock,
  Dumbbell,
  X,
  Save,
  Trophy,
  ArrowLeft,
  Timer,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Plan, PlanData, PlanExercise, WorkoutExerciseLog } from "@shared/schema";

export default function WorkoutPlayer() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [exerciseLogs, setExerciseLogs] = useState<WorkoutExerciseLog[]>([]);
  const [notes, setNotes] = useState("");
  const [startTime] = useState(new Date());
  const [isCompleted, setIsCompleted] = useState(false);

  const { data: plan, isLoading } = useQuery<Plan>({
    queryKey: ["/api/plans", params.id],
  });

  const planData = plan?.data as PlanData | undefined;
  const todayExercises = planData?.weeks?.[0]?.days?.[0]?.exercises || [];
  const currentExercise = todayExercises[currentExerciseIndex];
  const totalExercises = todayExercises.length;
  const progress = totalExercises > 0 ? ((currentExerciseIndex) / totalExercises) * 100 : 0;

  useEffect(() => {
    if (todayExercises.length > 0 && exerciseLogs.length === 0) {
      setExerciseLogs(
        todayExercises.map((ex) => ({
          name: ex.name,
          sets: Array.from({ length: ex.sets }, (_, i) => ({
            setNumber: i + 1,
            targetReps: parseInt(ex.reps) || 10,
            actualReps: undefined,
            weight: undefined,
            completed: false,
          })),
        }))
      );
    }
  }, [todayExercises]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const duration = Math.round((new Date().getTime() - startTime.getTime()) / 60000);
      const response = await apiRequest("POST", "/api/workouts", {
        planId: params.id,
        exercises: exerciseLogs,
        notes,
        duration,
        completed: true,
      });
      if (!response.ok) throw new Error("Failed to save workout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      setIsCompleted(true);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to save workout" });
    },
  });

  const handleSetComplete = (exerciseIdx: number, setIdx: number) => {
    const updated = [...exerciseLogs];
    if (updated[exerciseIdx]?.sets[setIdx]) {
      updated[exerciseIdx].sets[setIdx].completed = !updated[exerciseIdx].sets[setIdx].completed;
      setExerciseLogs(updated);
    }
  };

  const handleRepsChange = (exerciseIdx: number, setIdx: number, value: string) => {
    const updated = [...exerciseLogs];
    if (updated[exerciseIdx]?.sets[setIdx]) {
      updated[exerciseIdx].sets[setIdx].actualReps = parseInt(value) || undefined;
      setExerciseLogs(updated);
    }
  };

  const handleWeightChange = (exerciseIdx: number, setIdx: number, value: string) => {
    const updated = [...exerciseLogs];
    if (updated[exerciseIdx]?.sets[setIdx]) {
      updated[exerciseIdx].sets[setIdx].weight = parseFloat(value) || undefined;
      setExerciseLogs(updated);
    }
  };

  const startRest = (seconds: number) => {
    setRestTime(seconds);
    setIsResting(true);
  };

  const nextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentSetIndex(0);
    }
  };

  const prevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
      setCurrentSetIndex(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!plan || !currentExercise) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Workout Found</h2>
        <p className="text-muted-foreground mb-4">This plan doesn't have any exercises yet.</p>
        <Link href="/plans">
          <Button>Back to Plans</Button>
        </Link>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-chart-2/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-chart-2" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Workout Complete!</h2>
            <p className="text-muted-foreground mb-6">
              Great job! You crushed your workout today.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{totalExercises}</div>
                <div className="text-sm text-muted-foreground">Exercises</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {Math.round((new Date().getTime() - startTime.getTime()) / 60000)}
                </div>
                <div className="text-sm text-muted-foreground">Minutes</div>
              </div>
            </div>
            <Link href="/dashboard">
              <Button className="w-full" data-testid="button-back-dashboard">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" data-testid="button-close">
              <X className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 text-center">
            <h1 className="font-semibold">{plan.title}</h1>
            <p className="text-sm text-muted-foreground">
              Exercise {currentExerciseIndex + 1} of {totalExercises}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save"
          >
            <Save className="w-5 h-5" />
          </Button>
        </div>
        <Progress value={progress} className="h-1" />
      </header>

      {/* Rest Timer Overlay */}
      {isResting && (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center">
          <div className="text-center">
            <Timer className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
            <h2 className="text-4xl font-bold mb-2">Rest Time</h2>
            <div className="text-6xl font-bold text-primary mb-6">
              {formatTime(restTime)}
            </div>
            <Button variant="outline" onClick={() => setIsResting(false)}>
              Skip Rest
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Current Exercise */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary">{currentExercise.name}</Badge>
              <Badge variant="outline">
                {currentExercise.sets} sets × {currentExercise.reps} reps
              </Badge>
            </div>
            <CardTitle className="text-3xl">{currentExercise.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Exercise Image Placeholder */}
            <div className="aspect-video bg-muted rounded-xl mb-6 flex items-center justify-center">
              <Dumbbell className="w-16 h-16 text-muted-foreground/50" />
            </div>

            {/* Sets Table */}
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-2">
                <div className="col-span-2">Set</div>
                <div className="col-span-3">Target</div>
                <div className="col-span-3">Reps</div>
                <div className="col-span-3">Weight</div>
                <div className="col-span-1"></div>
              </div>
              {exerciseLogs[currentExerciseIndex]?.sets.map((set, idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg ${
                    set.completed ? "bg-chart-2/10" : "bg-muted/50"
                  }`}
                >
                  <div className="col-span-2 font-medium">{set.setNumber}</div>
                  <div className="col-span-3 text-muted-foreground">{set.targetReps} reps</div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder={String(set.targetReps)}
                      value={set.actualReps || ""}
                      onChange={(e) => handleRepsChange(currentExerciseIndex, idx, e.target.value)}
                      className="h-9"
                      data-testid={`input-reps-${idx}`}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="kg"
                      value={set.weight || ""}
                      onChange={(e) => handleWeightChange(currentExerciseIndex, idx, e.target.value)}
                      className="h-9"
                      data-testid={`input-weight-${idx}`}
                    />
                  </div>
                  <div className="col-span-1">
                    <Checkbox
                      checked={set.completed}
                      onCheckedChange={() => handleSetComplete(currentExerciseIndex, idx)}
                      data-testid={`checkbox-set-${idx}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Rest Button */}
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => startRest(currentExercise.rest || 60)}
                data-testid="button-start-rest"
              >
                <Clock className="w-4 h-4 mr-2" />
                Start Rest ({currentExercise.rest || 60}s)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent className="p-4">
            <Textarea
              placeholder="Add notes about this workout..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
              data-testid="textarea-notes"
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={prevExercise}
            disabled={currentExerciseIndex === 0}
            data-testid="button-prev"
          >
            <SkipBack className="w-4 h-4 mr-2" />
            Previous
          </Button>
          {currentExerciseIndex === totalExercises - 1 ? (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              data-testid="button-finish"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Finish Workout
            </Button>
          ) : (
            <Button onClick={nextExercise} data-testid="button-next">
              Next
              <SkipForward className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
