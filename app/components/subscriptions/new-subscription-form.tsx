"use client";

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";

import { createSubscriptionAction, type NewSubscriptionState } from "@/app/subscriptions/new/actions";
import styles from "./new-subscription-form.module.css";

type CategoryOption = {
    id: string;
    name: string;
};

type ExistingType = {
    id: string;
    name: string;
    categoryId: string;
    categoryName: string;
    imgLink: string;
};

type NewSubscriptionFormProps = {
    categories: CategoryOption[];
    existingType: ExistingType | null;
    isCustom: boolean;
};

const initialState: NewSubscriptionState = {
    error: null,
    needsDuplicateConfirm: false,
    duplicateMessage: null,
    confirmNonce: null
};

const periods = [
    { value: "1", label: "Ежемесячно" },
    { value: "3", label: "Раз в 3 месяца" },
    { value: "6", label: "Раз в 6 месяцев" },
    { value: "12", label: "Раз в год" }
];

const todayDateString = () => {
    const date = new Date();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
};

export function NewSubscriptionForm({ categories, existingType, isCustom }: NewSubscriptionFormProps) {
    const [state, formAction, isPending] = useActionState(createSubscriptionAction, initialState);
    const [iconUrl, setIconUrl] = useState(existingType?.imgLink ?? "");
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const formRef = useRef<HTMLFormElement>(null);
    const confirmInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!state.needsDuplicateConfirm || !state.confirmNonce) {
            return;
        }

        const confirmed = window.confirm(
            state.duplicateMessage ?? "Такая подписка уже есть в вашем списке. Добавить еще одну?"
        );

        if (confirmed) {
            if (confirmInputRef.current) {
                confirmInputRef.current.value = "true";
            }
            formRef.current?.requestSubmit();
        } else if (confirmInputRef.current) {
            confirmInputRef.current.value = "false";
        }
    }, [state.confirmNonce, state.duplicateMessage, state.needsDuplicateConfirm]);

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
                body: formData
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
        <form ref={formRef} action={formAction} className={styles.form}>
            <input type="hidden" name="typeId" value={existingType?.id ?? ""} />
            <input type="hidden" name="custom" value={isCustom ? "1" : "0"} />
            <input ref={confirmInputRef} type="hidden" name="confirmDuplicate" defaultValue="false" />
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
                <input
                    className={styles.input}
                    type="text"
                    name="name"
                    defaultValue={existingType?.name ?? ""}
                    placeholder="Напр. Netflix"
                    readOnly={!isCustom}
                    required={isCustom}
                />
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
                        {periods.map(period => (
                            <option key={period.value} value={period.value}>
                                {period.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Категория</label>
                <select
                    className={styles.input}
                    name="categoryId"
                    defaultValue={isCustom ? "" : existingType?.categoryId ?? ""}
                    disabled={!isCustom}
                    required={isCustom}
                >
                    {isCustom ? <option value="">Выберите категорию</option> : null}
                    {categories.map(category => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
                {!isCustom && existingType ? (
                    <p className={styles.staticHint}>Категория: {existingType.categoryName}</p>
                ) : null}
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Дата ближайшей оплаты</label>
                <input className={styles.input} type="date" name="nextPaymentAt" defaultValue={todayDateString()} />
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Способ оплаты</label>
                <input
                    className={styles.input}
                    type="text"
                    name="paymentMethodLabel"
                    placeholder="Напр. Visa •••• 4242"
                />
            </div>

            {state.error ? <p className={styles.errorText}>{state.error}</p> : null}

            <button className={styles.submitButton} type="submit" disabled={isPending || isUploading}>
                {isPending ? "Сохраняем..." : "Добавить подписку"}
            </button>
        </form>
    );
}
