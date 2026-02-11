"use client";
/*
Note: "use client" is a Next.js App Router directive that tells React to render the component as
a client component rather than a server component. This establishes the server-client boundary,
providing access to client-side functionality such as hooks and event handlers to this component and
any of its imported children. Although the SpeciesCard component itself does not use any client-side
functionality, it is beneficial to move it to the client because it is rendered in a list with a unique
key prop in species/page.tsx. When multiple component instances are rendered from a list, React uses the unique key prop
on the client-side to correctly match component state and props should the order of the list ever change.
React server components don't track state between rerenders, so leaving the uniquely identified components (e.g. SpeciesCard)
can cause errors with matching props and state in child components if the list order changes.
*/
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
type Species = Database["public"]["Tables"]["species"]["Row"];

// Define kingdom enum for use in Zod schema and displaying dropdown options in the form
const kingdoms = z.enum(["Animalia", "Plantae", "Fungi", "Protista", "Archaea", "Bacteria"]);

// Use Zod to define the shape + requirements of a Species entry; used in form validation
const speciesSchema = z.object({
  scientific_name: z
    .string()
    .trim()
    .min(1)
    .transform((val) => val?.trim()),
  common_name: z
    .string()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  kingdom: kingdoms,
  total_population: z.number().int().positive().min(1).nullable(),
  image: z
    .string()
    .url()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  description: z
    .string()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
});

type FormData = z.infer<typeof speciesSchema>;

// Default values for the form fields.
/* Because the react-hook-form (RHF) used here is a controlled form (not an uncontrolled form),
fields that are nullable/not required should explicitly be set to `null` by default.
Otherwise, they will be `undefined` by default, which will raise warnings because `undefined` conflicts with controlled components.
All form fields should be set to non-undefined default values.
Read more here: https://legacy.react-hook-form.com/api/useform/
*/

export default function SpeciesCard({ species, userId }: { species: Species; userId: string }) {
  const router = useRouter();

  const [isOpenOne, setIsOpenOne] = useState(false);
  const [isOpenTwo, setIsOpenTwo] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(true);

  const handleEditRequest = () => {
    const hasAccess = species.author === userId;
    setShowFormDialog(hasAccess);
    setIsOpenTwo(true);
  };

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

  const onSubmit = async (input: FormData) => {
    // The `input` prop contains data that has already been processed by zod. We can now use it in a supabase query
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("species")
      .update({
        common_name: input.common_name,
        description: input.description,
        kingdom: input.kingdom,
        scientific_name: input.scientific_name,
        total_population: input.total_population,
        image: input.image,
      })
      .eq("id", species.id);

    // Catch and report errors from Supabase and exit the onSubmit function with an early 'return' if an error occurred.
    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    // Because Supabase errors were caught above, the remainder of the function will only execute upon a successful edit

    // Reset form values to the default (empty) values.
    // Practically, this line can be removed because router.refresh() also resets the form. However, we left it as a reminder that you should generally consider form "cleanup" after an add/edit operation.
    form.reset(defaultValues);

    setIsOpenTwo(false);

    // Refresh all server components in the current route. This helps display the newly created species because species are fetched in a server component, species/page.tsx.
    // Refreshing that server component will display the new species from Supabase
    router.refresh();

    return toast({
      title: "Species edited!",
      description: "Successfully edited " + species.scientific_name + ".",
    });
  };

  return (
    <div className="m-4 flex w-72 min-w-72 flex-none flex-col justify-between rounded border-2 p-3 shadow">
      {species.image && (
        <div className="relative h-40 w-full">
          <Image src={species.image} alt={species.scientific_name} fill style={{ objectFit: "cover" }} />
        </div>
      )}
      <div>
        <h3 className="mt-3 text-2xl font-semibold">{species.scientific_name}</h3>
        <h4 className="text-lg font-light italic">{species.common_name}</h4>
        <p>{species.description ? species.description.slice(0, 150).trim() + "..." : ""}</p>
      </div>
      {/* Replace the button with the detailed view dialog. */}
      <div className="mt-2 flex gap-2">
        <Dialog open={isOpenOne} onOpenChange={setIsOpenOne}>
          <DialogTrigger asChild>
            <Button className="w-full">Learn More</Button>
          </DialogTrigger>
          <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{species.scientific_name}</DialogTitle>
              <DialogDescription>
                <br></br>
                View species info here. Click&quot;Close&quot; below when you&apos;re done.
              </DialogDescription>
            </DialogHeader>
            <p>
              <b>Species Name: </b>
              {species.common_name} ({species.scientific_name})<br></br>
              <br></br>
              <b>Description: </b>
              {species.description}
              <br></br>
              <br></br>
              <b>Kingdom: </b>
              {species.kingdom}
              <br></br>
              <br></br>
              <b>Total Population:</b>
              {species.total_population}
              <br></br>
              <br></br>
            </p>
            <div className="flex">
              <DialogClose asChild>
                <Button type="button" className="ml-1 mr-1 flex-auto" variant="secondary">
                  Close
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={isOpenTwo} onOpenChange={setIsOpenTwo}>
          <DialogTrigger asChild>
            <Button className="w-full" onClick={handleEditRequest}>
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
            {showFormDialog ? (
              <>
                <DialogHeader>
                  <b>Edit Species Info</b>
                </DialogHeader>
                <DialogDescription>
                  Edit a species you added. Click &quot;Edit Species&quot; below when you&apos;re done.
                </DialogDescription>
                <Form {...form}>
                  <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)}>
                    <div className="grid w-full items-center gap-4">
                      <FormField
                        control={form.control}
                        name="scientific_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Scientific Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Cavia porcellus" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="common_name"
                        render={({ field }) => {
                          // We must extract value from field and convert a potential defaultValue of `null` to "" because inputs can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                          const { value, ...rest } = field;
                          return (
                            <FormItem>
                              <FormLabel>Common Name</FormLabel>
                              <FormControl>
                                <Input value={value ?? ""} placeholder="Guinea pig" {...rest} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name="kingdom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kingdom</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(kingdoms.parse(value))}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a kingdom" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectGroup>
                                  {kingdoms.options.map((kingdom, index) => (
                                    <SelectItem key={index} value={kingdom}>
                                      {kingdom}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="total_population"
                        render={({ field }) => {
                          const { value, ...rest } = field;
                          return (
                            <FormItem>
                              <FormLabel>Total population</FormLabel>
                              <FormControl>
                                {/* Using shadcn/ui form with number: https://github.com/shadcn-ui/ui/issues/421 */}
                                <Input
                                  type="number"
                                  value={value ?? ""}
                                  placeholder="300000"
                                  {...rest}
                                  onChange={(event) => field.onChange(+event.target.value)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => {
                          // We must extract value from field and convert a potential defaultValue of `null` to "" because inputs can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                          const { value, ...rest } = field;
                          return (
                            <FormItem>
                              <FormLabel>Image URL</FormLabel>
                              <FormControl>
                                <Input
                                  value={value ?? ""}
                                  placeholder="https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/George_the_amazing_guinea_pig.jpg/440px-George_the_amazing_guinea_pig.jpg"
                                  {...rest}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => {
                          // We must extract value from field and convert a potential defaultValue of `null` to "" because textareas can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                          const { value, ...rest } = field;
                          return (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  value={value ?? ""}
                                  placeholder="The guinea pig or domestic guinea pig, also known as the cavy or domestic cavy, is a species of rodent belonging to the genus Cavia in the family Caviidae."
                                  {...rest}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      <div className="flex">
                        <Button type="submit" className="ml-1 mr-1 flex-auto">
                          Edit Species
                        </Button>
                        <DialogClose asChild>
                          <Button type="button" className="ml-1 mr-1 flex-auto" variant="secondary">
                            Cancel
                          </Button>
                        </DialogClose>
                      </div>
                    </div>
                  </form>
                </Form>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Access Denied</DialogTitle>
                  <DialogDescription>You cannot edit this species because you did not create it.</DialogDescription>
                </DialogHeader>
                <div className="flex">
                  <DialogClose asChild>
                    <Button type="button" className="ml-1 mr-1 flex-auto" variant="secondary">
                      Close
                    </Button>
                  </DialogClose>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
