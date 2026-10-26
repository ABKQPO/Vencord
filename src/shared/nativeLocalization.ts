/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { MessageParams, normalizeLocale, translateMessage } from "@utils/localization/core";

import english from "../locales/en-US/native.json";
import chinese from "../locales/zh-CN/native.json";

/** Native and preload code must not initialize the renderer localization store. */
export function nativeMessage(locale: string | undefined, key: keyof typeof english, params?: MessageParams): string {
    return translateMessage(normalizeLocale(locale), key, english[key], params, chinese);
}
