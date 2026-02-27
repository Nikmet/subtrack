"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type PaymentMethodsToastTriggerProps = {
  toastType?: string;
  name?: string;
};

export function PaymentMethodsToastTrigger({ toastType, name }: PaymentMethodsToastTriggerProps) {
  const router = useRouter();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!toastType || firedRef.current) {
      return;
    }

    const safeName = name?.trim() || "Способ оплаты";

    if (toastType === "created") {
      toast.success(`${safeName} добавлен.`);
    } else if (toastType === "updated") {
      toast.success(`${safeName} обновлен.`);
    } else if (toastType === "default") {
      toast.success(`${safeName} выбран по умолчанию.`);
    } else if (toastType === "deleted") {
      toast.success(`${safeName} удален.`);
    } else if (toastType === "exists") {
      toast.info("Такой способ оплаты уже есть.");
    } else if (toastType === "invalid") {
      toast.warning("Введите корректное название способа оплаты.");
    } else if (toastType === "used") {
      toast.warning("Нельзя удалить способ оплаты, который используется в подписках.");
    } else if (toastType === "forbidden") {
      toast.warning("Действие недоступно.");
    } else {
      return;
    }

    firedRef.current = true;
    router.replace("/settings/payment-methods", { scroll: false });
  }, [toastType, name, router]);

  return null;
}
