"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { formatPaymentMethodLabel, normalizeCardNumberInput } from "@/app/utils/payment-method-formatters";
import { getAuthorizedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const normalizeText = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const normalizeCardNumber = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") {
    return "";
  }

  return normalizeCardNumberInput(value);
};

const toPage = (toastType: string, name?: string) => {
  const params = new URLSearchParams({ toast: toastType });
  if (name) {
    params.set("name", name);
  }
  return `/settings/payment-methods?${params.toString()}`;
};

const revalidateAll = () => {
  revalidatePath("/settings");
  revalidatePath("/settings/payment-methods");
  revalidatePath("/search");
  revalidatePath("/");
};

const getBank = async (bankId: string) => {
  if (!bankId) {
    return null;
  }

  return prisma.bank.findUnique({
    where: { id: bankId },
    select: {
      id: true,
      name: true,
    },
  });
};

const isValidCardNumber = (value: string) => value.length >= 4 && value.length <= 24;

export async function createPaymentMethodAction(formData: FormData) {
  const user = await getAuthorizedUser();
  const bankId = normalizeText(formData.get("bankId"));
  const cardNumber = normalizeCardNumber(formData.get("cardNumber"));

  if (!isValidCardNumber(cardNumber) || !bankId) {
    redirect(toPage("invalid"));
  }

  const bank = await getBank(bankId);
  if (!bank) {
    redirect(toPage("invalid"));
  }

  const existing = await prisma.paymentMethod.findFirst({
    where: {
      userId: user.id,
      cardNumber: {
        equals: cardNumber,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (existing) {
    redirect(toPage("exists"));
  }

  const methodsCount = await prisma.paymentMethod.count({
    where: {
      userId: user.id,
    },
  });

  await prisma.paymentMethod.create({
    data: {
      userId: user.id,
      bankId,
      cardNumber,
      isDefault: methodsCount === 0,
    },
  });

  revalidateAll();
  redirect(toPage("created", formatPaymentMethodLabel(bank.name, cardNumber)));
}

export async function renamePaymentMethodAction(formData: FormData) {
  const user = await getAuthorizedUser();
  const paymentMethodId = normalizeText(formData.get("paymentMethodId"));
  const bankId = normalizeText(formData.get("bankId"));
  const cardNumber = normalizeCardNumber(formData.get("cardNumber"));

  if (!paymentMethodId || !bankId || !isValidCardNumber(cardNumber)) {
    redirect(toPage("invalid"));
  }

  const method = await prisma.paymentMethod.findFirst({
    where: {
      id: paymentMethodId,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!method) {
    redirect(toPage("forbidden"));
  }

  const bank = await getBank(bankId);
  if (!bank) {
    redirect(toPage("invalid"));
  }

  const existing = await prisma.paymentMethod.findFirst({
    where: {
      userId: user.id,
      id: {
        not: paymentMethodId,
      },
      cardNumber: {
        equals: cardNumber,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (existing) {
    redirect(toPage("exists"));
  }

  await prisma.paymentMethod.update({
    where: {
      id: paymentMethodId,
    },
    data: {
      bankId,
      cardNumber,
    },
  });

  await prisma.userSubscription.updateMany({
    where: {
      userId: user.id,
      paymentMethodId,
    },
    data: {
      paymentCardLabel: formatPaymentMethodLabel(bank.name, cardNumber),
    },
  });

  revalidateAll();
  redirect(toPage("updated", formatPaymentMethodLabel(bank.name, cardNumber)));
}

export async function setDefaultPaymentMethodAction(formData: FormData) {
  const user = await getAuthorizedUser();
  const paymentMethodId = normalizeText(formData.get("paymentMethodId"));

  if (!paymentMethodId) {
    redirect(toPage("invalid"));
  }

  const method = await prisma.paymentMethod.findFirst({
    where: {
      id: paymentMethodId,
      userId: user.id,
    },
    select: {
      id: true,
      cardNumber: true,
      bank: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!method) {
    redirect(toPage("forbidden"));
  }

  await prisma.$transaction([
    prisma.paymentMethod.updateMany({
      where: {
        userId: user.id,
      },
      data: {
        isDefault: false,
      },
    }),
    prisma.paymentMethod.update({
      where: {
        id: method.id,
      },
      data: {
        isDefault: true,
      },
    }),
  ]);

  revalidateAll();
  redirect(toPage("default", formatPaymentMethodLabel(method.bank.name, method.cardNumber)));
}

export async function deletePaymentMethodAction(formData: FormData) {
  const user = await getAuthorizedUser();
  const paymentMethodId = normalizeText(formData.get("paymentMethodId"));

  if (!paymentMethodId) {
    redirect(toPage("invalid"));
  }

  const method = await prisma.paymentMethod.findFirst({
    where: {
      id: paymentMethodId,
      userId: user.id,
    },
    select: {
      id: true,
      cardNumber: true,
      bank: {
        select: {
          name: true,
        },
      },
      isDefault: true,
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
  });

  if (!method) {
    redirect(toPage("forbidden"));
  }

  if (method._count.subscriptions > 0) {
    redirect(toPage("used"));
  }

  await prisma.paymentMethod.delete({
    where: {
      id: method.id,
    },
  });

  if (method.isDefault) {
    const replacement = await prisma.paymentMethod.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
      },
    });

    if (replacement) {
      await prisma.paymentMethod.update({
        where: {
          id: replacement.id,
        },
        data: {
          isDefault: true,
        },
      });
    }
  }

  revalidateAll();
  redirect(toPage("deleted", formatPaymentMethodLabel(method.bank.name, method.cardNumber)));
}
