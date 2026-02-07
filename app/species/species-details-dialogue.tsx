import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Database } from "@/lib/schema";

type Species = Database["public"]["Tables"]["species"]["Row"];

export default function SpeciiesDetailsDialogue({ species }: { species: Species }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mt-3 w-full">Learn More</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {species.scientific_name} | {species.kingdom}
          </DialogTitle>

          {species.common_name && <DialogDescription>{species.common_name}</DialogDescription>}
          {species.total_population && (
            <DialogDescription>Total population: {species.total_population}</DialogDescription>
          )}
          {species.description && <DialogDescription>{species.description}</DialogDescription>}
        </DialogHeader>
        {/* TODO: Add form fields for species details here. */}
      </DialogContent>
    </Dialog>
  );
}
