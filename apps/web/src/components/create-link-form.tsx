import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL *</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug *</FormLabel>
              <FormControl>
                <Input placeholder="my-link" {...field} />
              </FormControl>
              <FormDescription>
                This will be the short identifier for your link
              </FormDescription>
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
                <Input placeholder="Optional description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiration Date</FormLabel>
              <FormControl>
                <Input 
                  type="datetime-local" 
                  min={new Date().toISOString().slice(0, 16)}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Leave empty for links that don't expire
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={createLink.isPending}>
          {createLink.isPending ? "Creating..." : "Create Link"}
        </Button>
      </form>
    </Form>
  );
}