"use client";

import { useActionState, useState, type ChangeEvent } from "react";

import { SUBSCRIPTION_CATEGORIES } from "@/app/constants/subscription-categories";
import {
  createCommonSubscriptionAction,
  type NewSubscriptionState,
} from "@/app/subscriptions/new/actions";
import styles from "./new-subscription-form.module.css";

const initialState: NewSubscriptionState = {
  error: null,
};

const periods = [
  { value: "1", label: "Ежемесячно" },
  { value: "3", label: "Раз в 3 месяца" },
  { value: "6", label: "Раз в 6 месяцев" },
  { value: "12", label: "Раз в год" },
];

export function NewSubscriptionForm() {
  const [state, formAction, isPending] = useActionState(createCommonSubscriptionAction, initialState);
  const [iconUrl, setIconUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Размер файла должен быть не больше 2MB.");
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
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="imgLink" value={iconUrl} />

      <div className={styles.iconField}>
        <label className={styles.iconDrop} htmlFor="iconUpload">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} alt="Иконка подписки" className={styles.iconPreview} />
          ) : (
            <span className={styles.iconPlaceholder}>Иконка</span>
          )}
        </label>
        <input
          id="iconUpload"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className={styles.fileInput}
          onChange={handleFileChange}
        />
        <p className={styles.iconHint}>{isUploading ? "Загружаем..." : "Нажмите, чтобы загрузить логотип"}</p>
        {uploadError ? <p className={styles.errorText}>{uploadError}</p> : null}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Название сервиса</label>
        <input className={styles.input} type="text" name="name" placeholder="Напр. Netflix" required />
      </div>

      <div className={styles.rowFields}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Стоимость</label>
          <input
            className={styles.input}
            type="number"
            step="0.01"
            min="0.01"
            name="price"
            placeholder="0.00"
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Период</label>
          <select className={styles.input} name="period" defaultValue="1" required>
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Категория</label>
        <select className={styles.input} name="category" defaultValue="other" required>
          {SUBSCRIPTION_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {state.error ? <p className={styles.errorText}>{state.error}</p> : null}

      <button className={styles.submitButton} type="submit" disabled={isPending || isUploading}>
        {isPending ? "Сохраняем..." : "Создать подписку"}
      </button>
    </form>
  );
}
