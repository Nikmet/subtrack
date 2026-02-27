"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type AdminToastTriggerProps = {
  toastType?: string;
  name?: string;
  redirectPath?: string;
};

export function AdminToastTrigger({ toastType, name, redirectPath = "/admin" }: AdminToastTriggerProps) {
  const router = useRouter();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!toastType || firedRef.current) {
      return;
    }

    const safeName = name?.trim() || "Подписка";

    if (toastType === "published") {
      toast.success(`${safeName} опубликована.`);
    } else if (toastType === "rejected") {
      toast.warning(`${safeName} отклонена.`);
    } else if (toastType === "deleted") {
      toast.warning(`${safeName} удалена из каталога.`);
    } else {
      return;
    }

    firedRef.current = true;
    router.replace(redirectPath, { scroll: false });
  }, [toastType, name, redirectPath, router]);

  return null;
}
