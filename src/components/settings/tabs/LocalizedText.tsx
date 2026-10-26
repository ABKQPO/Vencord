/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { tr, useLocale } from "@utils/localization";
import { React } from "@webpack/common";
import type { ReactNode } from "react";

/** Named slots keep linked or emphasized sentences translatable as a whole. */
export function LocalizedText({ id, fallback, slots }: {
    id: string;
    fallback: string;
    slots: Record<string, ReactNode>;
}) {
    useLocale();
    return <>{tr(id, fallback).split(/(\{\w+\})/g).map((part, index) =>
        <React.Fragment key={index}>{Object.hasOwn(slots, part.slice(1, -1)) && /^\{\w+\}$/.test(part)
            ? slots[part.slice(1, -1)]
            : part}</React.Fragment>
    )}</>;
}
