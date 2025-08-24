import { Link } from "@tanstack/react-router";

export function PreviewLink({
  link,
}: {
  link: {
    id: number;
    slug: string;
    url: string;
    expiration: string | null;
    description?: string | null;
    createdAt: string;
  };
}) {
  return (
    <Link to="/link/$id" params={{ id: link.id.toString() }}>
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">/{link.slug}</h3>
            <p className="text-sm text-muted-foreground">{link.url}</p>
            {link.description && (
              <p className="text-sm mt-1">{link.description}</p>
            )}
            {link.expiration && (
              <p className="text-xs text-muted-foreground mt-1">
                Expires: {new Date(link.expiration).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Created: {new Date(link.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </Link>
  );
}
