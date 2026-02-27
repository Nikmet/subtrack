"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SettingsSecurityToastTriggerProps = {
  toastType?: string;
};

export function SettingsSecurityToastTrigger({ toastType }: SettingsSecurityToastTriggerProps) {
  const router = useRouter();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!toastType || firedRef.current) {
      return;
    }

    if (toastType === "changed") {
      toast.success("Пароль обновлен.");
    } else if (toastType === "current_wrong") {
      toast.warning("Текущий пароль введен неверно.");
    } else if (toastType === "mismatch") {
      toast.warning("Новый пароль и подтверждение не совпадают.");
    } else if (toastType === "weak") {
      toast.warning("Новый пароль должен быть не короче 8 символов.");
    } else if (toastType === "invalid") {
      toast.warning("Заполните все поля формы.");
    } else {
      return;
    }

    firedRef.current = true;
    router.replace("/settings/security", { scroll: false });
  }, [toastType, router]);

  return null;
}
