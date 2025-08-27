import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { trpcClient, queryClient } from "@/utils/trpc";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  slug: z.string().min(2, "Slug must be at least 2 characters").max(64, "Slug must be less than 64 characters"),
  description: z.string().max(2024, "Description must be less than 2024 characters").optional(),
  expiration: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateLinkFormProps {
  onSuccess?: () => void;
}

export function CreateLinkForm({ onSuccess }: CreateLinkFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      slug: "",
      description: "",
      expiration: "",
    },
  });

  const createLink = useMutation({
    mutationFn: async (input: { url: string; slug: string; description?: string; expiration?: Date }) => {
      return trpcClient.links.create.mutate(input);
    },
    onSuccess: () => {
      toast.success("Link created successfully!");
      queryClient.invalidateQueries({ queryKey: [["links", "getAll"], { type: "query" }] });
      form.reset();
      onSuccess?.();
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
      expiration: values.expiration ? new Date(values.expiration) : undefined,
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
              <FormLabel className="text-sm font-light text-muted-foreground">URL *</FormLabel>
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
              <FormLabel className="text-sm font-light text-muted-foreground">Slug *</FormLabel>
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
              <FormLabel className="text-sm font-light text-muted-foreground">Description</FormLabel>
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
              <FormLabel className="text-sm font-light text-muted-foreground">Expiration Date</FormLabel>
              <FormControl>
                <Input 
                  type="datetime-local" 
                  min={new Date().toISOString().slice(0, 16)}
                  {...field} 
                  className="border-0 border-b border-border rounded-none bg-transparent px-0 py-3 text-base font-light placeholder:text-muted-foreground/40 focus:border-foreground focus:ring-0"
                />
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