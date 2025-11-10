// src/app/join/[code]/page.tsx

import { redirect } from "next/navigation";

type PageProps = {
  params: {
    code: string;
  };
};

export default function JoinPage({ params }: PageProps) {
  // Server-side redirect
  redirect(`/referrals?code=${params.code}`);
}
