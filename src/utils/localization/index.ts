/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { messages } from "../../locales";
import { MessageParams, translateMessage } from "./core";
import { getLocale } from "./runtime";

export * from "./core";
export * from "./runtime";

/** Stable message IDs are checked against the bilingual catalogs by checkLocalization. */
export function tr(key: string, fallback: string, params?: MessageParams): string {
    return translateMessage(getLocale(), key, fallback, params, messages["zh-CN"]);
}
