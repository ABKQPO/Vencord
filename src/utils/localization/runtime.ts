/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Locale, normalizeLocale } from "./core";

// This module is also used by ErrorBoundary and plugin declarations. Importing
// webpack commons here would initialize them through their own dependency cycle.
const common = () => typeof Vencord === "undefined" ? undefined : Vencord.Webpack?.Common;

export function getLocale(): Locale {
    return normalizeLocale(common()?.LocaleStore?.locale);
}

/** Also handles a React tree mounted before Discord has exposed LocaleStore. */
export function subscribeLocale(listener: () => void): () => void {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const attach = (store: NonNullable<ReturnType<typeof common>>["LocaleStore"]) => {
        if (!active) return;
        store.addChangeListener(listener);
        unsubscribe = () => store.removeChangeListener(listener);
        listener();
    };

    const store = common()?.LocaleStore;
    if (store) attach(store);
    else Vencord.Webpack.waitFor(Vencord.Webpack.filters.byStoreName("LocaleStore"), attach);

    return () => {
        active = false;
        unsubscribe?.();
    };
}

export function useLocale(): Locale {
    return Vencord.Webpack.Common.React.useSyncExternalStore(subscribeLocale, getLocale, () => "en-US");
}
