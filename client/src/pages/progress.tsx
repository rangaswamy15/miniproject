import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Scale,
  Ruler,
  Camera,
  Calendar,
  Loader2,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Progress as ProgressType } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const progressFormSchema = z.object({
  weightKg: z.string().optional(),
  bodyFatPct: z.string().optional(),
  chest: z.string().optional(),
  waist: z.string().optional(),
  hips: z.string().optional(),
  arms: z.string().optional(),
  notes: z.string().optional(),
});

type ProgressFormData = z.infer<typeof progressFormSchema>;

export default function Progress() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: progressData, isLoading } = useQuery<ProgressType[]>({
    queryKey: ["/api/progress"],
  });

  const form = useForm<ProgressFormData>({
    resolver: zodResolver(progressFormSchema),
    defaultValues: {
      weightKg: "",
      bodyFatPct: "",
      chest: "",
      waist: "",
      hips: "",
      arms: "",
      notes: "",
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: ProgressFormData) => {
      const measurements: Record<string, number> = {};
      if (data.chest) measurements.chest = parseFloat(data.chest);
      if (data.waist) measurements.waist = parseFloat(data.waist);
      if (data.hips) measurements.hips = parseFloat(data.hips);
      if (data.arms) measurements.arms = parseFloat(data.arms);

      const response = await apiRequest("POST", "/api/progress", {
        weightKg: data.weightKg ? parseFloat(data.weightKg) : undefined,
        bodyFatPct: data.bodyFatPct ? parseFloat(data.bodyFatPct) : undefined,
        measurements: Object.keys(measurements).length > 0 ? measurements : undefined,
        notes: data.notes || undefined,
      });
      if (!response.ok) throw new Error("Failed to add progress");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/chart"] });
      toast({ title: "Progress logged successfully!" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to log progress" });
    },
  });

  const onSubmit = (data: ProgressFormData) => {
    addMutation.mutate(data);
  };

  const chartData = progressData
    ?.filter((p) => p.weightKg)
    .map((p) => ({
      date: p.date,
      weight: p.weightKg,
    }))
    .reverse();

  const latestProgress = progressData?.[0];
  const previousProgress = progressData?.[1];

  const getWeightChange = () => {
    if (!latestProgress?.weightKg || !previousProgress?.weightKg) return null;
    return latestProgress.weightKg - previousProgress.weightKg;
  };

  const weightChange = getWeightChange();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Progress Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your fitness journey over time
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-log-progress">
              <Plus className="w-4 h-4 mr-2" />
              Log Progress
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log Your Progress</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weightKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Scale className="w-3 h-3" />
                          Weight (kg)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1" 
                            placeholder="70.5" 
                            data-testid="input-weight"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bodyFatPct"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body Fat (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1" 
                            placeholder="18.5" 
                            data-testid="input-bodyfat"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3 flex items-center gap-1">
                    <Ruler className="w-3 h-3" />
                    Measurements (cm)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="chest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chest</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="95" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="waist"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Waist</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="80" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hips"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hips</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="95" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="arms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Arms</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="35" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="How are you feeling today?" 
                          data-testid="textarea-notes"
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={addMutation.isPending}
                  data-testid="button-save-progress"
                >
                  {addMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Progress"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Current Weight</span>
            </div>
            <div className="text-3xl font-bold">
              {latestProgress?.weightKg ? `${latestProgress.weightKg} kg` : "-"}
            </div>
            {weightChange !== null && (
              <div className={`flex items-center gap-1 text-sm mt-1 ${
                weightChange < 0 ? "text-chart-2" : weightChange > 0 ? "text-chart-5" : "text-muted-foreground"
              }`}>
                {weightChange < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                {Math.abs(weightChange).toFixed(1)} kg
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="w-5 h-5 text-chart-3" />
              <span className="text-sm text-muted-foreground">Body Fat</span>
            </div>
            <div className="text-3xl font-bold">
              {latestProgress?.bodyFatPct ? `${latestProgress.bodyFatPct}%` : "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-5 h-5 text-chart-4" />
              <span className="text-sm text-muted-foreground">Photos</span>
            </div>
            <div className="text-3xl font-bold">
              {progressData?.filter((p) => p.photoUrl).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-chart-5" />
              <span className="text-sm text-muted-foreground">Entries</span>
            </div>
            <div className="text-3xl font-bold">
              {progressData?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weight Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Weight Progress
          </CardTitle>
          <CardDescription>Your weight trend over time</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData && chartData.length > 1 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    domain={["dataMin - 2", "dataMax + 2"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(value) => format(new Date(value), "MMMM d, yyyy")}
                    formatter={(value: number) => [`${value} kg`, "Weight"]}
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
                <Scale className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Log at least 2 entries to see your progress chart</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress History */}
      <Card>
        <CardHeader>
          <CardTitle>Progress History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : progressData && progressData.length > 0 ? (
            <div className="space-y-4">
              {progressData.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg bg-muted/50 flex flex-col md:flex-row md:items-center gap-4"
                  data-testid={`progress-entry-${entry.id}`}
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {format(new Date(entry.date), "MMMM d, yyyy")}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      {entry.weightKg && (
                        <span>Weight: {entry.weightKg} kg</span>
                      )}
                      {entry.bodyFatPct && (
                        <span>Body Fat: {entry.bodyFatPct}%</span>
                      )}
                      {entry.measurements && (
                        <span>
                          Measurements: {Object.entries(entry.measurements as Record<string, number>)
                            .map(([k, v]) => `${k}: ${v}cm`)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="mt-2 text-sm">{entry.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Scale className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No progress entries yet</p>
              <p className="text-sm">Start tracking your progress to see your journey</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
