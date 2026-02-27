"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SettingsProfileToastTriggerProps = {
  toastType?: string;
};

export function SettingsProfileToastTrigger({ toastType }: SettingsProfileToastTriggerProps) {
  const router = useRouter();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!toastType || firedRef.current) {
      return;
    }

    if (toastType === "saved") {
      toast.success("Профиль обновлен.");
    } else if (toastType === "email_exists") {
      toast.warning("Пользователь с таким email уже существует.");
    } else if (toastType === "invalid") {
      toast.warning("Проверьте корректность имени, email и ссылки на аватар.");
    } else {
      return;
    }

    firedRef.current = true;
    router.replace("/settings/profile", { scroll: false });
  }, [toastType, router]);

  return null;
}
