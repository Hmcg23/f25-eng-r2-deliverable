import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import type { Database } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type Species = Database["public"]["Tables"]["species"]["Row"];

const kingdoms = z.enum(["Animalia", "Plantae", "Fungi", "Protista", "Archaea", "Bacteria"]);

export default function SpeciesDetailsDialogue({ species }: { species: Species }) {
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const speciesSchema = z.object({
    scientific_name: z
      .string()
      .trim()
      .min(1)
      .transform((val) => val?.trim()),
    common_name: z
      .string()
      .nullable()
      .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
    kingdom: kingdoms,
    total_population: z.number().int().positive().min(1).nullable(),
    image: z
      .string()
      .url()
      .nullable()
      .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
    description: z
      .string()
      .nullable()
      .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  });

  type FormData = z.infer<typeof speciesSchema>;

  const defaultValues: Partial<FormData> = {
    scientific_name: species.scientific_name,
    common_name: species.common_name,
    kingdom: species.kingdom,
    total_population: species.total_population,
    image: species.image,
    description: species.description,
  };

  const form = useForm<FormData>({
    resolver: zodResolver(speciesSchema),
    defaultValues,
    mode: "onChange",
  });

  const isAuthor = species.author === userId;

  const startEditing = () => {
    setIsEditing(true);
  };
  const cancelEditing = () => {
    isEditing && window.confirm("Revert all unsaved changes?");
    setIsEditing(false);
  };

  const onSubmit = async (input: FormData) => {
    if (!userId) return;

    window.confirm("Are you sure you want to submit?");

    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase
      .from("species")
      .update({
        scientific_name: input.scientific_name,
        common_name: input.common_name,
        kingdom: input.kingdom,
        total_population: input.total_population,
        image: input.image,
        description: input.description,
      })
      .eq("id", species.id)
      .eq("author", userId);

    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    setIsEditing(false);
    form.reset(input);
    router.refresh();

    return toast({
      title: "Species updated!",
      description: `Saved your changes to ${input.scientific_name}`,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        // val === false means user clicked outside or pressed Esc
        if (!val) cancelEditing(); // reset the form
        setOpen(val); // actually open/close the dialog
      }}
    >
      <DialogTrigger asChild>
        <Button className="mt-3 w-full">Learn More</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {species.scientific_name} | {species.kingdom}
          </DialogTitle>

          {!isEditing && open && (
            <>
              {species.common_name && <DialogDescription>{species.common_name}</DialogDescription>}
              {species.total_population && (
                <DialogDescription>Total population: {species.total_population}</DialogDescription>
              )}
              {species.description && <DialogDescription>{species.description}</DialogDescription>}
            </>
          )}

          {isAuthor && !isEditing && (
            <Button onClick={startEditing} className="mt-3 max-w-2xl">
              Edit Species
            </Button>
          )}
        </DialogHeader>

        {isAuthor && isEditing && (
          <Form {...form}>
            <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)}>
              <div className="grid w-full items-center gap-4">
                {/* Scientific Name */}
                <FormField
                  control={form.control}
                  name="scientific_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scientific Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Common Name */}
                <FormField
                  control={form.control}
                  name="common_name"
                  render={({ field }) => {
                    const { value, ...rest } = field;
                    return (
                      <FormItem>
                        <FormLabel>Common Name</FormLabel>
                        <FormControl>
                          <Input value={value ?? ""} {...rest} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Kingdom */}
                <FormField
                  control={form.control}
                  name="kingdom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kingdom</FormLabel>
                      <Select value={field.value} onValueChange={(val) => field.onChange(kingdoms.parse(val))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {kingdoms.options.map((k, i) => (
                              <SelectItem key={i} value={k}>
                                {k}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Total Population */}
                <FormField
                  control={form.control}
                  name="total_population"
                  render={({ field }) => {
                    const { value, ...rest } = field;
                    return (
                      <FormItem>
                        <FormLabel>Total Population</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={value ?? ""}
                            {...rest}
                            onChange={(e) => field.onChange(+e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Image */}
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => {
                    const { value, ...rest } = field;
                    return (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input value={value ?? ""} {...rest} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => {
                    const { value, ...rest } = field;
                    return (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea value={value ?? ""} {...rest} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <div className="mt-2 flex">
                  <Button type="submit" className="mr-2 flex-auto">
                    Confirm
                  </Button>
                  <Button
                    type="button"
                    className="flex-auto"
                    variant="secondary"
                    onClick={() => {
                      setOpen(false);
                      cancelEditing();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
