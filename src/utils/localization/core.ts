/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type Locale = "en-US" | "zh-CN";
export type MessageParams = Record<string, string | number | bigint | boolean | null | undefined>;
export type MessageCatalog = Readonly<Record<string, string>>;

export interface SettingTranslation {
    name?: string;
    description?: string;
    placeholder?: string;
    options?: Record<string, string>;
}

export interface PluginTranslation {
    name: string;
    description: string;
    settings: Record<string, SettingTranslation>;
}

export function normalizeLocale(locale?: string): Locale {
    return locale?.replace("_", "-").toLowerCase() === "zh-cn" ? "zh-CN" : "en-US";
}

export function formatMessage(message: string, params: MessageParams = {}): string {
    return message.replace(/\{(\w+)\}/g, (token, key: string) =>
        Object.hasOwn(params, key) && params[key] != null ? String(params[key]) : token);
}

export function translateMessage(locale: Locale, key: string, fallback: string, params: MessageParams = {}, chinese: MessageCatalog = {}): string {
    return formatMessage(locale === "zh-CN" && Object.hasOwn(chinese, key) ? chinese[key] : fallback, params);
}

export function translatePlural(locale: Locale, count: number, one: string, other: string, params: MessageParams = {}): string {
    return formatMessage(new Intl.PluralRules(locale).select(count) === "one" ? one : other, { ...params, count });
}

export function getOptionKey(value: unknown): string {
    return `${typeof value}:${String(value)}`;
}

/** Copy presentation fields only. Values, validation, callbacks and the original definition stay intact. */
export function localizeSetting<T extends object>(definition: T, translation?: SettingTranslation): T {
    if (!translation) return definition;

    const result = { ...definition } as T & {
        displayName?: string;
        description?: string;
        placeholder?: string;
        options?: { label: string; value: unknown; }[];
    };

    if (translation.name != null) result.displayName = translation.name;
    if (translation.description != null) result.description = translation.description;
    if (translation.placeholder != null) result.placeholder = translation.placeholder;
    if (result.options && translation.options) {
        const { options } = translation;
        result.options = result.options.map(option => ({ ...option, label: options[getOptionKey(option.value)] ?? option.label }));
    }

    return result;
}
