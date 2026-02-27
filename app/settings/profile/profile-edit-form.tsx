"use client";

import { useState, type ChangeEvent } from "react";

import { SubmitButton } from "@/app/components/forms/submit-button";
import { UserAvatar } from "@/app/components/user-avatar/user-avatar";

import { updateProfileAction } from "./actions";
import styles from "./profile.module.css";

type ProfileEditFormProps = {
  user: {
    name: string;
    email: string;
    avatarLink: string | null;
  };
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const [avatarLink, setAvatarLink] = useState(user.avatarLink ?? "");
  const [name, setName] = useState(user.name);
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

      const response = await fetch("/api/uploads/avatar", {
        method: "POST",
        body: formData,
      });

      const json = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !json.url) {
        setUploadError(json.error ?? "Не удалось загрузить аватар.");
        return;
      }

      setAvatarLink(json.url);
    } catch {
      setUploadError("Ошибка загрузки. Попробуйте снова.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form action={updateProfileAction} className={styles.form}>
      <div className={styles.avatarSection}>
        <UserAvatar
          src={avatarLink}
          name={name}
          wrapperClassName={styles.avatarWrap}
          imageClassName={styles.avatarImage}
          fallbackClassName={styles.avatarFallback}
          fallbackText={getInitials(name) || "?"}
        />

        <label className={styles.uploadButton} htmlFor="avatarUpload">
          {isUploading ? "Загрузка..." : "Загрузить аватар"}
        </label>
        <input
          id="avatarUpload"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className={styles.fileInput}
          onChange={handleFileChange}
        />
        {uploadError ? <p className={styles.errorText}>{uploadError}</p> : null}
      </div>

      <label className={styles.label} htmlFor="name">
        Имя
      </label>
      <input
        id="name"
        className={styles.input}
        name="name"
        type="text"
        minLength={2}
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />

      <label className={styles.label} htmlFor="email">
        Email
      </label>
      <input id="email" className={styles.input} name="email" type="email" defaultValue={user.email} required />

      <label className={styles.label} htmlFor="avatarLink">
        URL аватара
      </label>
      <input
        id="avatarLink"
        className={styles.input}
        name="avatarLink"
        type="url"
        value={avatarLink}
        onChange={(event) => setAvatarLink(event.target.value)}
        placeholder="https://..."
      />

      <SubmitButton className={styles.submitButton} idleLabel="Сохранить" pendingLabel="Сохраняем..." />
    </form>
  );
}
