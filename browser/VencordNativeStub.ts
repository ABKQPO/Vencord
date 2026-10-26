/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/// <reference path="../src/modules.d.ts" />
/// <reference path="../src/globals.d.ts" />

// Be very careful with imports in this file to avoid circular dependency issues.
// Only import pure modules that don't import other parts of Vencord.
import monacoHtmlLocal from "file://monacoWin.html?minify";
import * as DataStore from "@api/DataStore";
import type { Settings } from "@api/Settings";
import { getThemeInfo } from "@main/themes";
import { debounce } from "@shared/debounce";
import { nativeMessage } from "@shared/nativeLocalization";
import { Locale, normalizeLocale } from "@utils/localization/core";
import { localStorage } from "@utils/localStorage";
import { getStylusWebStoreUrl } from "@utils/web";
import { EXTENSION_BASE_URL, metaReady, RENDERER_CSS_URL } from "@utils/web-metadata";

// listeners for ipc.on
const cssListeners = new Set<(css: string) => void>();
const NOOP = () => { };
const NOOP_ASYNC = async () => { };

const setCssDebounced = debounce((css: string) => VencordNative.quickCss.set(css));

const themeStore = DataStore.createStore("VencordThemes", "VencordThemeData");

let quickCssWindow: Window | null = null;
let quickCssLocale: Locale = "en-US";
let quickCssUpdate = Promise.resolve();

function initializeQuickCssWindow(win: Window, locale: Locale, state?: { css: string; viewState: unknown; }) {
    (win as any).disposeQuickCss?.();
    (win as any).quickCssOriginalWorker ??= (win as any).Worker;
    (win as any).Worker = (win as any).quickCssOriginalWorker;
    Object.assign(win, {
        baseUrl: EXTENSION_BASE_URL,
        setCss: setCssDebounced,
        getCurrentCss: () => state ? Promise.resolve(state.css) : VencordNative.quickCss.get(),
        getTheme: VencordNative.quickCss.getEditorTheme,
        quickCssLocale: locale,
        quickCssTitle: nativeMessage(locale, "native.quickCss.title"),
        quickCssEditorLabel: nativeMessage(locale, "native.quickCss.editorLabel"),
        quickCssViewState: state?.viewState,
        quickCssGeneration: ((win as any).quickCssGeneration ?? 0) + 1,
        getQuickCssState: undefined,
        disposeQuickCss: undefined
    });
    win.document.open();
    win.document.write(monacoHtmlLocal);
    win.document.close();
}

function updateQuickCssLocale(requestedLocale: string) {
    quickCssUpdate = quickCssUpdate.catch(() => { }).then(async () => {
        const locale = normalizeLocale(requestedLocale);
        const win = quickCssWindow;
        if (!win || win.closed || quickCssLocale === locale) return;

        const state = await (win as any).getQuickCssState?.();
        if (win.closed || win !== quickCssWindow) return;
        if (state) await VencordNative.quickCss.set(state.css);
        quickCssLocale = locale;
        initializeQuickCssWindow(win, locale, state);
    });
    return quickCssUpdate;
}

// probably should make this less cursed at some point
window.VencordNative = {
    themes: {
        uploadTheme: (fileName: string, fileData: string) => DataStore.set(fileName, fileData, themeStore),
        deleteTheme: (fileName: string) => DataStore.del(fileName, themeStore),
        getThemesList: () => DataStore.entries(themeStore).then(entries =>
            entries.map(([name, css]) => getThemeInfo(css, name.toString()))
        ),
        getThemeData: (fileName: string) => DataStore.get(fileName, themeStore),
        getSystemValues: async () => ({}),

        openFolder: async () => Promise.reject("themes:openFolder is not supported on web"),
    },

    native: {
        getVersions: () => ({}),
        supportsWindowsMaterial: () => false,
        openExternal: async (url) => void open(url, "_blank"),
        getRendererCss: async () => {
            if (IS_USERSCRIPT)
                // need to wait for next tick for _vcUserScriptRendererCss to be set
                return Promise.resolve().then(() => window._vcUserScriptRendererCss);

            await metaReady;

            return fetch(RENDERER_CSS_URL)
                .then(res => res.text());
        },
        onRendererCssUpdate: NOOP,
    },

    updater: {
        getRepo: async () => ({ ok: true, value: "https://github.com/Vendicated/Vencord" }),
        getUpdates: async () => ({ ok: true, value: [] }),
        update: async () => ({ ok: true, value: false }),
        rebuild: async () => ({ ok: true, value: true }),
    },

    quickCss: {
        get: () => DataStore.get("VencordQuickCss").then(s => s ?? ""),
        set: async (css: string) => {
            await DataStore.set("VencordQuickCss", css);
            cssListeners.forEach(l => l(css));
        },
        addChangeListener(cb) {
            cssListeners.add(cb);
        },
        addThemeChangeListener: NOOP,
        openFile: NOOP_ASYNC,
        setEditorLocale: updateQuickCssLocale,
        async openEditor(requestedLocale?: string) {
            const locale = normalizeLocale(requestedLocale);
            if (IS_USERSCRIPT) {
                const shouldOpenWebStore = confirm(nativeMessage(locale, "native.quickCss.userscriptPrompt"));
                if (shouldOpenWebStore) {
                    window.open(getStylusWebStoreUrl(), "_blank");
                }
                return;
            }

            if (quickCssWindow && !quickCssWindow.closed) {
                await updateQuickCssLocale(locale);
                quickCssWindow.focus();
                return;
            }

            const features = `popup,width=${Math.min(window.innerWidth, 1000)},height=${Math.min(window.innerHeight, 1000)}`;
            const win = open("about:blank", "VencordQuickCss", features);
            if (!win) {
                alert(nativeMessage(locale, "native.quickCss.popupFailed"));
                return;
            }

            quickCssWindow = win;
            quickCssLocale = locale;
            initializeQuickCssWindow(win, locale);
        },
        getEditorTheme: () => {
            const { getTheme, Theme } = require("@utils/discord");

            return getTheme() === Theme.Light
                ? "vs-light"
                : "vs-dark";
        }
    },

    settings: {
        get: () => {
            try {
                return JSON.parse(localStorage.getItem("VencordSettings") || "{}");
            } catch (e) {
                console.error("Failed to parse settings from localStorage: ", e);
                return {};
            }
        },
        set: async (s: Settings) => localStorage.setItem("VencordSettings", JSON.stringify(s)),
        openFolder: async () => Promise.reject("settings:openFolder is not supported on web"),
    },

    pluginHelpers: {} as any,
    csp: {} as any,
};

