import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Dumbbell,
  Calendar,
  TrendingUp,
  Plus,
  Search,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Exercise } from "@shared/schema";
import { insertExerciseSchema } from "@shared/schema";
import { format } from "date-fns";
import { z } from "zod";

const exerciseFormSchema = insertExerciseSchema.extend({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  primaryMuscle: z.string().min(1, "Primary muscle is required"),
});

type ExerciseFormData = z.infer<typeof exerciseFormSchema>;

export default function Admin() {
  const { toast } = useToast();
  const [searchUsers, setSearchUsers] = useState("");
  const [searchExercises, setSearchExercises] = useState("");
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalUsers: number;
    totalPlans: number;
    totalWorkouts: number;
    averageWorkoutsPerWeek: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: exercises, isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      instructions: "",
      primaryMuscle: "",
      equipment: "BODYWEIGHT",
      videoUrl: "",
      imageUrl: "",
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: async (data: ExerciseFormData) => {
      const response = await apiRequest("POST", "/api/exercises", data);
      if (!response.ok) throw new Error("Failed to add exercise");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({ title: "Exercise added successfully!" });
      setIsExerciseDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to add exercise" });
    },
  });

  const onSubmitExercise = (data: ExerciseFormData) => {
    addExerciseMutation.mutate(data);
  };

  const filteredUsers = users?.filter(
    (user) =>
      user.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
      user.email.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredExercises = exercises?.filter(
    (exercise) =>
      exercise.name.toLowerCase().includes(searchExercises.toLowerCase()) ||
      exercise.primaryMuscle.toLowerCase().includes(searchExercises.toLowerCase())
  );

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-primary" },
    { title: "Active Plans", value: stats?.totalPlans ?? 0, icon: Calendar, color: "text-chart-2" },
    { title: "Total Workouts", value: stats?.totalWorkouts ?? 0, icon: Dumbbell, color: "text-chart-4" },
    { title: "Avg. Workouts/Week", value: stats?.averageWorkoutsPerWeek?.toFixed(1) ?? 0, icon: TrendingUp, color: "text-chart-5" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and exercise library</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <span className="text-sm text-muted-foreground">{stat.title}</span>
                </div>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="exercises" data-testid="tab-exercises">
            <Dumbbell className="w-4 h-4 mr-2" />
            Exercises
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage all registered users</CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-users"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((user) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.fitnessLevel || "-"}</TableCell>
                        <TableCell>{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exercises Tab */}
        <TabsContent value="exercises">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Exercise Library</CardTitle>
                  <CardDescription>Manage the exercise database</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search exercises..."
                      value={searchExercises}
                      onChange={(e) => setSearchExercises(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-exercises"
                    />
                  </div>
                  <Dialog open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-exercise">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Exercise
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add New Exercise</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmitExercise)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Exercise Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Barbell Squat" data-testid="input-exercise-name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Describe the exercise..." data-testid="textarea-description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="primaryMuscle"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Primary Muscle</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-muscle">
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs", "Core", "Glutes", "Calves"].map((muscle) => (
                                        <SelectItem key={muscle} value={muscle}>{muscle}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="equipment"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Equipment</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || "BODYWEIGHT"}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-equipment">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {["BODYWEIGHT", "DUMBBELL", "BARBELL", "MACHINE", "KETTLEBELL", "BAND", "CABLE"].map((eq) => (
                                        <SelectItem key={eq} value={eq}>{eq.charAt(0) + eq.slice(1).toLowerCase()}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="instructions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Instructions (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Step-by-step instructions..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={addExerciseMutation.isPending}
                            data-testid="button-submit-exercise"
                          >
                            {addExerciseMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              "Add Exercise"
                            )}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {exercisesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Primary Muscle</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Difficulty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExercises?.map((exercise) => (
                      <TableRow key={exercise.id} data-testid={`row-exercise-${exercise.id}`}>
                        <TableCell className="font-medium">{exercise.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{exercise.primaryMuscle}</Badge>
                        </TableCell>
                        <TableCell>{exercise.equipment}</TableCell>
                        <TableCell>{exercise.difficulty || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
