"use client";

import { useId, useState, type ChangeEvent } from "react";

import { SubmitButton } from "@/app/components/forms/submit-button";

import styles from "../admin.module.css";

type BankFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  formClassName: string;
  submitClassName: string;
  submitIdleLabel: string;
  submitPendingLabel: string;
  bankId?: string;
  initialName?: string;
  initialIconLink?: string;
};

const getFallbackLetter = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "?";
  }

  const first = Array.from(trimmed)[0];
  return first ? first.toLocaleUpperCase("ru-RU") : "?";
};

export function BankForm({
  action,
  formClassName,
  submitClassName,
  submitIdleLabel,
  submitPendingLabel,
  bankId,
  initialName = "",
  initialIconLink = "",
}: BankFormProps) {
  const [name, setName] = useState(initialName);
  const [iconLink, setIconLink] = useState(initialIconLink);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputId = useId();

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

      setIconLink(json.url);
    } catch {
      setUploadError("Ошибка загрузки. Попробуйте снова.");
    } finally {
      setIsUploading(false);
    }
  };

  const showImage = iconLink.trim().length > 0;

  return (
    <form action={action} className={formClassName}>
      {bankId ? <input type="hidden" name="bankId" value={bankId} /> : null}

      <div className={styles.uploadField}>
        <div className={styles.uploadPreviewWrap}>
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconLink} alt={name || "Иконка банка"} className={styles.uploadPreviewImage} />
          ) : (
            <span className={styles.uploadPreviewFallback}>{getFallbackLetter(name)}</span>
          )}
        </div>

        <label className={styles.uploadButton} htmlFor={fileInputId}>
          {isUploading ? "Загрузка..." : "Загрузить иконку"}
        </label>
        <input
          id={fileInputId}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className={styles.fileInput}
          onChange={handleFileChange}
        />
      </div>

      {uploadError ? <p className={styles.uploadError}>{uploadError}</p> : null}

      <input
        className={styles.input}
        name="name"
        type="text"
        placeholder="Название банка"
        minLength={2}
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <input
        className={styles.input}
        name="iconLink"
        type="url"
        placeholder="URL иконки"
        value={iconLink}
        onChange={(event) => setIconLink(event.target.value)}
        required
      />
      <SubmitButton className={submitClassName} idleLabel={submitIdleLabel} pendingLabel={submitPendingLabel} />
    </form>
  );
}
