/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";

type SubscriptionIconProps = {
    src: string;
    name: string;
    wrapperClassName: string;
    imageClassName: string;
    fallbackClassName: string;
};

const getFallbackLetter = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) {
        return "?";
    }

    const first = Array.from(trimmed)[0];
    return first ? first.toLocaleUpperCase("ru-RU") : "?";
};

export function SubscriptionIcon({
    src,
    name,
    wrapperClassName,
    imageClassName,
    fallbackClassName
}: SubscriptionIconProps) {
    const [loadFailed, setLoadFailed] = useState(false);
    const normalizedSrc = src.trim();
    const showFallback = normalizedSrc.length === 0 || loadFailed;
    const letter = useMemo(() => getFallbackLetter(name), [name]);

    return (
        <div className={wrapperClassName} aria-label={name}>
            {showFallback ? (
                <span className={fallbackClassName} aria-hidden>
                    {letter}
                </span>
            ) : (
                <img
                    src={normalizedSrc}
                    alt={name}
                    className={imageClassName}
                    loading="lazy"
                    onError={() => setLoadFailed(true)}
                />
            )}
        </div>
    );
}
