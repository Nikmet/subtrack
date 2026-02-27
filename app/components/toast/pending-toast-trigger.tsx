"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type PendingToastTriggerProps = {
  toastType?: string;
  name?: string;
};

export function PendingToastTrigger({ toastType, name }: PendingToastTriggerProps) {
  const router = useRouter();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!toastType || firedRef.current) {
      return;
    }

    if (toastType !== "submitted") {
      return;
    }

    const safeName = name?.trim() || "Подписка";
    toast.success(`${safeName} отправлена на модерацию.`);
    firedRef.current = true;
    router.replace("/subscriptions/pending", { scroll: false });
  }, [toastType, name, router]);

  return null;
}
