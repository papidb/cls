import type { Link as LinkType } from "@/entities";
import { Link } from "@tanstack/react-router";

export function PreviewLink({ link }: { link: LinkType }) {
  return (
    <Link to="/links/$slug" params={{ slug: link.slug.toString() }}>
      <div className="border-b border-border pb-6 hover:opacity-60 transition-opacity cursor-pointer group">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1 min-w-0">
              <h3 className="text-lg font-light tracking-wide text-foreground group-hover:text-muted-foreground transition-colors truncate">
                /{link.slug}
              </h3>
              <p className="text-sm font-light text-muted-foreground/80 leading-relaxed truncate">
                {link.url}
              </p>
              {link.description && (
                <p className="text-sm font-light text-muted-foreground leading-relaxed mt-2 truncate">
                  {link.description}
                </p>
              )}
            </div>
            <div className="text-xs font-light text-muted-foreground/60 ml-4 flex-shrink-0">
              {new Date(link.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
          {link.expiration && (
            <p className="text-xs font-light text-muted-foreground/60">
              Expires {new Date(link.expiration).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
