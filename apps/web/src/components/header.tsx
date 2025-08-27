import { Link } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

const links = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-b border-border/40 z-50">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-row items-center justify-between px-6 py-4">
          <nav className="flex gap-8">
            {links.map(({ to, label }) => {
              return (
                <Link
                  key={to}
                  to={to}
                  className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                  activeProps={{
                    className: "text-sm font-bold text-foreground underline",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
