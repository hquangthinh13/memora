import type { Href } from "expo-router";
import { Link } from "expo-router";

import { AppButton } from "./AppButton";

type NavLinkProps = {
  href: string;
  title: string;
  variant?: "primary" | "secondary" | "ghost";
};

export function NavLink({ href, title, variant = "secondary" }: NavLinkProps) {
  return (
    <Link href={href as Href} asChild>
      <AppButton title={title} variant={variant} />
    </Link>
  );
}
