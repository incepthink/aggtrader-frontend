"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export default function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`text-xl relative pb-3 px-2 after:absolute after:inset-x-0 after:bottom-0 hover:after:h-[2px] transition after:bg-gradient-to-r after:from-[#00FFE9] after:to-[#003B3C] ${
        isActive && "after:h-[2px]"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
