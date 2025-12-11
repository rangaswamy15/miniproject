import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, Dumbbell, Filter, Play, X } from "lucide-react";
import type { Exercise } from "@shared/schema";

const MUSCLE_GROUPS = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Core",
  "Glutes",
  "Calves",
];

const EQUIPMENT_TYPES = [
  "All",
  "BODYWEIGHT",
  "DUMBBELL",
  "BARBELL",
  "MACHINE",
  "KETTLEBELL",
  "BAND",
  "CABLE",
];

export default function Exercises() {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("All");
  const [equipmentFilter, setEquipmentFilter] = useState("All");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const { data: exercises, isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const filteredExercises = exercises?.filter((exercise) => {
    const matchesSearch =
      exercise.name.toLowerCase().includes(search.toLowerCase()) ||
      exercise.description.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle =
      muscleFilter === "All" ||
      exercise.primaryMuscle.toLowerCase() === muscleFilter.toLowerCase();
    const matchesEquipment =
      equipmentFilter === "All" || exercise.equipment === equipmentFilter;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  const getMuscleColor = (muscle: string) => {
    const colors: Record<string, string> = {
      chest: "bg-chart-1/10 text-chart-1",
      back: "bg-chart-2/10 text-chart-2",
      shoulders: "bg-chart-3/10 text-chart-3",
      biceps: "bg-chart-4/10 text-chart-4",
      triceps: "bg-chart-5/10 text-chart-5",
      legs: "bg-primary/10 text-primary",
      core: "bg-chart-2/10 text-chart-2",
      glutes: "bg-chart-4/10 text-chart-4",
      calves: "bg-chart-3/10 text-chart-3",
    };
    return colors[muscle.toLowerCase()] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Exercise Library</h1>
        <p className="text-muted-foreground mt-1">
          Browse our comprehensive collection of exercises
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-exercises"
          />
        </div>
        <Select value={muscleFilter} onValueChange={setMuscleFilter}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-muscle-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Muscle Group" />
          </SelectTrigger>
          <SelectContent>
            {MUSCLE_GROUPS.map((muscle) => (
              <SelectItem key={muscle} value={muscle}>
                {muscle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-equipment-filter">
            <Dumbbell className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Equipment" />
          </SelectTrigger>
          <SelectContent>
            {EQUIPMENT_TYPES.map((equipment) => (
              <SelectItem key={equipment} value={equipment}>
                {equipment === "All" ? "All Equipment" : equipment.charAt(0) + equipment.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {(muscleFilter !== "All" || equipmentFilter !== "All" || search) && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <Badge variant="secondary" className="gap-1">
              Search: {search}
              <button onClick={() => setSearch("")}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {muscleFilter !== "All" && (
            <Badge variant="secondary" className="gap-1">
              Muscle: {muscleFilter}
              <button onClick={() => setMuscleFilter("All")}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {equipmentFilter !== "All" && (
            <Badge variant="secondary" className="gap-1">
              Equipment: {equipmentFilter}
              <button onClick={() => setEquipmentFilter("All")}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setMuscleFilter("All");
              setEquipmentFilter("All");
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-40 w-full mb-4 rounded-lg" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredExercises && filteredExercises.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((exercise) => (
            <Card
              key={exercise.id}
              className="overflow-hidden hover-elevate cursor-pointer"
              onClick={() => setSelectedExercise(exercise)}
              data-testid={`card-exercise-${exercise.id}`}
            >
              <CardContent className="p-0">
                <div className="aspect-video bg-muted relative">
                  {exercise.imageUrl ? (
                    <img
                      src={exercise.imageUrl}
                      alt={exercise.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Dumbbell className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}
                  {exercise.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-6 h-6 text-foreground ml-1" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{exercise.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {exercise.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getMuscleColor(exercise.primaryMuscle)}>
                      {exercise.primaryMuscle}
                    </Badge>
                    <Badge variant="outline">
                      {exercise.equipment.charAt(0) + exercise.equipment.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Dumbbell className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No exercises found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}

      {/* Exercise Detail Dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
        <DialogContent className="max-w-2xl">
          {selectedExercise && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedExercise.name}</DialogTitle>
                <DialogDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={getMuscleColor(selectedExercise.primaryMuscle)}>
                      {selectedExercise.primaryMuscle}
                    </Badge>
                    <Badge variant="outline">
                      {selectedExercise.equipment.charAt(0) + selectedExercise.equipment.slice(1).toLowerCase()}
                    </Badge>
                    {selectedExercise.difficulty && (
                      <Badge variant="secondary">
                        {selectedExercise.difficulty}
                      </Badge>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedExercise.videoUrl ? (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <video
                      src={selectedExercise.videoUrl}
                      controls
                      className="w-full h-full"
                    />
                  </div>
                ) : selectedExercise.imageUrl ? (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={selectedExercise.imageUrl}
                      alt={selectedExercise.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedExercise.description}</p>
                </div>
                {selectedExercise.instructions && (
                  <div>
                    <h4 className="font-semibold mb-2">Instructions</h4>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {selectedExercise.instructions}
                    </p>
                  </div>
                )}
                {selectedExercise.secondaryMuscles && selectedExercise.secondaryMuscles.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Secondary Muscles</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedExercise.secondaryMuscles.map((muscle) => (
                        <Badge key={muscle} variant="outline">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
