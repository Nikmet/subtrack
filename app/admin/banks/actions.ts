"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const normalizeText = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const revalidateBankData = () => {
  revalidatePath("/admin/banks");
  revalidatePath("/settings/payment-methods");
  revalidatePath("/search");
};

export async function createBankAction(formData: FormData) {
  await requireAdminUser();

  const name = normalizeText(formData.get("name"));
  const iconLink = normalizeText(formData.get("iconLink"));

  if (name.length < 2 || !iconLink) {
    redirect("/admin/banks");
  }

  await prisma.bank.create({
    data: {
      name,
      iconLink,
    },
  });

  revalidateBankData();
  redirect("/admin/banks");
}

export async function updateBankAction(formData: FormData) {
  await requireAdminUser();

  const bankId = normalizeText(formData.get("bankId"));
  const name = normalizeText(formData.get("name"));
  const iconLink = normalizeText(formData.get("iconLink"));

  if (!bankId || name.length < 2 || !iconLink) {
    redirect("/admin/banks");
  }

  await prisma.bank.update({
    where: {
      id: bankId,
    },
    data: {
      name,
      iconLink,
    },
  });

  revalidateBankData();
  redirect("/admin/banks");
}

export async function deleteBankAction(formData: FormData) {
  await requireAdminUser();

  const bankId = normalizeText(formData.get("bankId"));
  if (!bankId) {
    redirect("/admin/banks");
  }

  const bank = await prisma.bank.findUnique({
    where: {
      id: bankId,
    },
    select: {
      id: true,
      _count: {
        select: {
          paymentMethods: true,
        },
      },
    },
  });

  if (!bank || bank._count.paymentMethods > 0) {
    redirect("/admin/banks");
  }

  await prisma.bank.delete({
    where: {
      id: bankId,
    },
  });

  revalidateBankData();
  redirect("/admin/banks");
}
