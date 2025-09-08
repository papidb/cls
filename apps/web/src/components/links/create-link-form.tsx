import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Link as LinkType } from "@/entities";
import { cn } from "@/lib/utils";
import { queryClient, trpc, trpcClient } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateTime } from "luxon";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(64, "Slug must be less than 64 characters"),
  description: z
    .string()
    .max(2024, "Description must be less than 2024 characters")
    .optional(),
  expiration: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateLinkFormProps {
  onSuccess?: (link: LinkType) => void;
}

export function CreateLinkForm({ onSuccess }: CreateLinkFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      slug: "",
      description: "",
      expiration: undefined,
    },
  });

  const createLink = useMutation({
    mutationFn: async (input: {
      url: string;
      slug: string;
      description?: string;
      expiration?: Date;
    }) => {
      const payload = {
        url: input.url,
        slug: input.slug,
        description: input.description,
        expiration: input.expiration
          ? (DateTime.fromJSDate(input.expiration).toISO() as string)
          : undefined,
      };
      return trpcClient.links.create.mutate(payload);
    },
    onSuccess: ({ link }) => {
      toast.success("Link created successfully!");
      queryClient.invalidateQueries({ queryKey: trpc.links.get.queryKey() });
      form.reset();
      onSuccess?.(link);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create link");
    },
  });

  const onSubmit = (values: FormValues) => {
    createLink.mutate({
      url: values.url,
      slug: values.slug,
      description: values.description || undefined,
      expiration: values.expiration || undefined,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-light text-muted-foreground">
                URL *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com"
                  {...field}
                  className="border-0 border-b border-border rounded-none bg-transparent px-0 py-3 text-base font-light placeholder:text-muted-foreground/40 focus:border-foreground focus:ring-0"
                />
              </FormControl>
              <FormMessage className="text-sm font-light" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-light text-muted-foreground">
                Slug *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="my-link"
                  {...field}
                  className="border-0 border-b border-border rounded-none bg-transparent px-0 py-3 text-base font-light placeholder:text-muted-foreground/40 focus:border-foreground focus:ring-0"
                />
              </FormControl>
              <FormDescription className="text-xs font-light text-muted-foreground/60 mt-1">
                Short identifier for your link
              </FormDescription>
              <FormMessage className="text-sm font-light" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-light text-muted-foreground">
                Description
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional description"
                  {...field}
                  className="border-0 border-b border-border rounded-none bg-transparent px-0 py-3 text-base font-light placeholder:text-muted-foreground/40 focus:border-foreground focus:ring-0"
                />
              </FormControl>
              <FormMessage className="text-sm font-light" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiration"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-light text-muted-foreground">
                Expiration Date
              </FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "justify-start border-0 border-b border-border rounded-none bg-transparent px-0 py-3 text-base font-light hover:bg-transparent focus:border-foreground focus:ring-0",
                        !field.value
                          ? "text-muted-foreground/40"
                          : "text-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) {
                          date.setHours(0, 0, 0, 0);
                          field.onChange(date);
                        } else {
                          field.onChange(undefined);
                        }
                      }}
                      disabled={{
                        before: DateTime.now()
                          .plus({ days: 1 })
                          .startOf("day")
                          .toJSDate(),
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormDescription className="text-xs font-light text-muted-foreground/60 mt-1">
                Leave empty for permanent links
              </FormDescription>
              <FormMessage className="text-sm font-light" />
            </FormItem>
          )}
        />

        <button
          type="submit"
          disabled={createLink.isPending}
          className="w-full py-4 text-foreground border border-border hover:bg-muted/30 transition-colors text-base font-light tracking-wide disabled:opacity-50 disabled:cursor-not-allowed mt-8"
        >
          {createLink.isPending ? "Creating..." : "Create Link"}
        </button>
      </form>
    </Form>
  );
}
