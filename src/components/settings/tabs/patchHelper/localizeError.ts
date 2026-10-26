/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { tr } from "@utils/localization";

/** Keep error identity in state so an open tool follows locale changes. */
export function localizePatchError(error?: string): string | undefined {
    switch (error) {
        case "No match. Perhaps that module is lazy loaded?":
            return tr("loader.settings.no.match.perhaps.that.module.is.lazy.loaded", "No match. Perhaps that module is lazy loaded?");
        case "Multiple matches. Please refine your filter":
            return tr("loader.settings.multiple.matches.please.refine.your.filter", "Multiple matches. Please refine your filter");
        case "Replacement must be a function":
            return tr("loader.settings.replacement.must.be.a.function", "Replacement must be a function");
        case "No 'find' field":
            return tr("loader.settings.no.find.field", "No 'find' field");
        case "No 'replacement' field":
            return tr("loader.settings.no.replacement.field", "No 'replacement' field");
        case "Invalid replacement":
            return tr("loader.settings.invalid.replacement", "Invalid replacement");
        case "No 'replacement.match' field":
            return tr("loader.settings.no.replacement.match.field", "No 'replacement.match' field");
        case "No 'replacement.replace' field":
            return tr("loader.settings.no.replacement.replace.field", "No 'replacement.replace' field");
        default:
            return error;
    }
}
