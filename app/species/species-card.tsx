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
import type { Database } from "@/lib/schema";
import Image from "next/image";
import { useState } from "react";
type Species = Database["public"]["Tables"]["species"]["Row"];

export default function SpeciesCard({ species }: { species: Species }) {
  const [isOpen, setIsOpen] = useState(false);

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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Edit</Button>
          </DialogTrigger>
          <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <b>Edit Species Info</b>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
