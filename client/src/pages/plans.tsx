import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  PlusCircle,
  Play,
  MoreVertical,
  Trash2,
  Pause,
  CheckCircle2,
  Clock,
  Target,
  Dumbbell,
  Brain,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Plan } from "@shared/schema";
import { format } from "date-fns";

export default function Plans() {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/plans/${id}`);
      if (!response.ok) throw new Error("Failed to delete plan");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({ title: "Plan deleted successfully" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to delete plan" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/plans/${id}`, { status });
      if (!response.ok) throw new Error("Failed to update plan");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({ title: "Plan updated successfully" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-chart-2/10 text-chart-2";
      case "PAUSED":
        return "bg-chart-4/10 text-chart-4";
      case "COMPLETED":
        return "bg-muted text-muted-foreground";
      case "CREATING":
        return "bg-primary/10 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "BEGINNER":
        return "bg-chart-2/10 text-chart-2";
      case "INTERMEDIATE":
        return "bg-chart-4/10 text-chart-4";
      case "ADVANCED":
        return "bg-chart-5/10 text-chart-5";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Workout Plans</h1>
          <p className="text-muted-foreground mt-1">
            Manage your AI-generated workout plans
          </p>
        </div>
        <Link href="/plans/new">
          <Button data-testid="button-new-plan">
            <PlusCircle className="w-4 h-4 mr-2" />
            Generate New Plan
          </Button>
        </Link>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="overflow-hidden" data-testid={`card-plan-${plan.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{plan.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {plan.description || plan.goal}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-plan-menu-${plan.id}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {plan.status === "ACTIVE" && (
                        <DropdownMenuItem
                          onClick={() => updateStatusMutation.mutate({ id: plan.id, status: "PAUSED" })}
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause Plan
                        </DropdownMenuItem>
                      )}
                      {plan.status === "PAUSED" && (
                        <DropdownMenuItem
                          onClick={() => updateStatusMutation.mutate({ id: plan.id, status: "ACTIVE" })}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Resume Plan
                        </DropdownMenuItem>
                      )}
                      {plan.status !== "COMPLETED" && (
                        <DropdownMenuItem
                          onClick={() => updateStatusMutation.mutate({ id: plan.id, status: "COMPLETED" })}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark Complete
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(plan.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Plan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getStatusColor(plan.status)}>
                    {plan.status}
                  </Badge>
                  <Badge className={getLevelColor(plan.level)}>
                    {plan.level}
                  </Badge>
                  {plan.generatedByAI && (
                    <Badge variant="outline" className="gap-1">
                      <Brain className="w-3 h-3" />
                      AI
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{plan.durationWeeks}w</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{plan.frequencyPerWeek}x/week</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Target className="w-4 h-4" />
                    <span className="truncate">{plan.goal}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-xs text-muted-foreground">
                    Created {format(new Date(plan.createdAt), "MMM d, yyyy")}
                  </span>
                  {plan.status === "ACTIVE" && (
                    <Link href={`/workout/${plan.id}`}>
                      <Button size="sm" data-testid={`button-start-plan-${plan.id}`}>
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    </Link>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Workout Plans Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Get started by generating your first AI-powered workout plan tailored to your goals and fitness level.
          </p>
          <Link href="/plans/new">
            <Button data-testid="button-create-first-plan">
              <PlusCircle className="w-4 h-4 mr-2" />
              Generate Your First Plan
            </Button>
          </Link>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the workout plan and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
