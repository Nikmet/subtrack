"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type HomeToastTriggerProps = {
  toastType?: string;
  name?: string;
};

export function HomeToastTrigger({ toastType, name }: HomeToastTriggerProps) {
  const router = useRouter();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current || !toastType) {
      return;
    }

    const safeName = name?.trim() || "Подписка";

    if (toastType === "added") {
      toast.success(`${safeName} добавлена в список подписок.`);
    } else if (toastType === "exists") {
      toast.info(`${safeName} уже есть в вашем списке.`);
    } else {
      return;
    }

    firedRef.current = true;
    router.replace("/", { scroll: false });
  }, [toastType, name, router]);

  return null;
}
