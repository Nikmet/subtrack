import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DEFAULT_BAN_REASON } from "@/app/constants/auth";
import { prisma } from "@/lib/prisma";

export type AuthorizedUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  isBanned: boolean;
  banReason: string | null;
};

export async function getAuthorizedUser(): Promise<AuthorizedUser> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isBanned: true,
      banReason: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.isBanned) {
    const reason = user.banReason?.trim() || DEFAULT_BAN_REASON;
    redirect(`/login?ban=${encodeURIComponent(reason)}`);
  }

  return user;
}

export async function requireAdminUser(): Promise<AuthorizedUser> {
  const user = await getAuthorizedUser();
  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return user;
}
