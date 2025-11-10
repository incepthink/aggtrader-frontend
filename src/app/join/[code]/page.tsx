// src/app/join/[code]/page.tsx

import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function JoinPage({ params }: PageProps) {
  const { code } = await params;
  redirect(`/referrals?code=${code}`);
}
