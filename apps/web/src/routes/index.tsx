import { createFileRoute, Link } from "@tanstack/react-router";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const healthCheck = useQuery(trpc.health.queryOptions());

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-12">
      <div className="container mx-auto max-w-6xl">
        {/* Hero Section */}
        <div className="text-center py-16 space-y-8">
          <h1 className="text-6xl font-bold text-foreground">CLS</h1>
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-xl text-muted-foreground leading-relaxed">
              Lightning-fast link shortening powered by Cloudflare's global edge network
            </p>
            <p className="text-base text-muted-foreground/80 leading-relaxed">
              Create custom short links with analytics, expiration dates, and detailed tracking. 
              Built for developers, marketers, and anyone who values performance and reliability.
            </p>
          </div>
          <div className="pt-4">
            <Link
              to="/links"
              className="inline-block px-12 py-4 text-foreground border border-border hover:bg-muted/30 transition-colors text-lg"
            >
              Create Your First Link
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-16 border-t border-border">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Who can use CLS?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground">Developers</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>API access</p>
                <p>Custom domains</p>
                <p>Webhooks</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground">Marketers</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Campaign tracking</p>
                <p>Click analytics</p>
                <p>A/B testing</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground">Content Creators</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Social media optimization</p>
                <p>Engagement tracking</p>
                <p>Performance insights</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground">Businesses</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Branded links</p>
                <p>Team collaboration</p>
                <p>Bulk operations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Footer */}
        <div className="py-16 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-left">
              <h3 className="text-lg font-bold text-foreground mb-2">System Status</h3>
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${
                    healthCheck.isLoading 
                      ? "bg-muted-foreground/40" 
                      : healthCheck.data 
                      ? "bg-green-500" 
                      : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-muted-foreground">
                  {healthCheck.isLoading
                    ? "Checking system status..."
                    : healthCheck.data
                    ? "All systems operational"
                    : "System experiencing issues"}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground/80">
                Powered by Cloudflare Workers
              </p>
              <p className="text-xs text-muted-foreground/60">
                Global edge deployment • 99.9% uptime
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
