import type { Href } from "expo-router";
import { Link } from "expo-router";

import { AppButton } from "./AppButton";

type NavLinkProps = {
  href: Href;
} & React.ComponentProps<typeof AppButton>;

export function NavLink({
  href,
  title,
  variant = "secondary",
  ...props
}: NavLinkProps) {
  return (
    <Link href={href} asChild>
      <AppButton title={title} variant={variant} {...props} />
    </Link>
  );
}
