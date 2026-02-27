"use client";

import { useState, type ChangeEvent } from "react";

import { SubmitButton } from "@/app/components/forms/submit-button";
import { SUBSCRIPTION_CATEGORIES } from "@/app/constants/subscription-categories";

import { updateCommonSubscriptionAction } from "../../actions";
import styles from "./edit-subscription.module.css";

type EditSubscriptionFormProps = {
  item: {
    id: string;
    name: string;
    imgLink: string;
    category: (typeof SUBSCRIPTION_CATEGORIES)[number]["value"];
    price: number;
    period: number;
    moderationComment: string | null;
  };
};

export function EditSubscriptionForm({ item }: EditSubscriptionFormProps) {
  const [iconUrl, setIconUrl] = useState(item.imgLink);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Размер файла должен быть не больше 10MB.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/icon", {
        method: "POST",
        body: formData,
      });

      const json = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !json.url) {
        setUploadError(json.error ?? "Не удалось загрузить иконку.");
        return;
      }

      setIconUrl(json.url);
    } catch {
      setUploadError("Ошибка загрузки. Попробуйте снова.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form action={updateCommonSubscriptionAction} className={styles.form}>
      <input type="hidden" name="commonSubscriptionId" value={item.id} />

      <div className={styles.iconField}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconUrl} alt="Иконка подписки" className={styles.iconPreview} />
        <label className={styles.uploadLabel} htmlFor="iconUpload">
          {isUploading ? "Загрузка..." : "Загрузить другую"}
        </label>
        <input
          id="iconUpload"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className={styles.fileInput}
          onChange={handleFileChange}
        />
        {uploadError ? <p className={styles.uploadError}>{uploadError}</p> : null}
      </div>

      <label className={styles.label} htmlFor="name">
        Название
      </label>
      <input className={styles.input} id="name" name="name" defaultValue={item.name} required />

      <label className={styles.label} htmlFor="imgLink">
        URL иконки
      </label>
      <input
        className={styles.input}
        id="imgLink"
        name="imgLink"
        value={iconUrl}
        onChange={(event) => setIconUrl(event.target.value)}
        required
      />

      <label className={styles.label} htmlFor="category">
        Категория
      </label>
      <select className={styles.input} id="category" name="category" defaultValue={item.category} required>
        {SUBSCRIPTION_CATEGORIES.map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </select>

      <label className={styles.label} htmlFor="price">
        Стоимость
      </label>
      <input
        className={styles.input}
        id="price"
        type="number"
        name="price"
        step="0.01"
        min="0.01"
        defaultValue={item.price}
        required
      />

      <label className={styles.label} htmlFor="period">
        Период
      </label>
      <select className={styles.input} id="period" name="period" defaultValue={String(item.period)} required>
        <option value="1">Ежемесячно</option>
        <option value="3">Раз в 3 месяца</option>
        <option value="6">Раз в 6 месяцев</option>
        <option value="12">Раз в год</option>
      </select>

      <label className={styles.label} htmlFor="moderationComment">
        Комментарий модерации
      </label>
      <textarea
        className={styles.textarea}
        id="moderationComment"
        name="moderationComment"
        defaultValue={item.moderationComment ?? ""}
        rows={3}
      />

      <SubmitButton className={styles.submitButton} idleLabel="Сохранить изменения" pendingLabel="Сохраняем..." />
    </form>
  );
}
