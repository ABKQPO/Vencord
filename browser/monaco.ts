/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./patch-worker";

import * as monaco from "monaco-editor/esm/vs/editor/editor.main.js";

declare global {
    const baseUrl: string;
    const getCurrentCss: () => Promise<string>;
    const setCss: (css: string) => void;
    const getTheme: () => string;
    const quickCssLocale: string;
    const quickCssTitle: string;
    const quickCssEditorLabel: string;
    const quickCssViewState: monaco.editor.ICodeEditorViewState | undefined;
    const quickCssGeneration: number;
    var getQuickCssState: (() => { css: string; viewState: monaco.editor.ICodeEditorViewState | null; }) | undefined;
    var disposeQuickCss: (() => void) | undefined;
}

const BASE = "/vendor/monaco/vs";

self.MonacoEnvironment = {
    getWorkerUrl(_moduleId: unknown, label: string) {
        const path = label === "css" ? "/language/css/css.worker.js" : "/editor/editor.worker.js";
        return new URL(BASE + path, baseUrl).toString();
    }
};

const generation = quickCssGeneration;
getCurrentCss().then(css => {
    if (generation !== quickCssGeneration) return;
    document.documentElement.lang = quickCssLocale;
    document.title = quickCssTitle;
    document.getElementById("title-bar")!.textContent = quickCssTitle;
    const editor = monaco.editor.create(
        document.getElementById("container")!,
        {
            value: css,
            language: "css",
            theme: getTheme(),
            ariaLabel: quickCssEditorLabel,
        }
    );
    if (quickCssViewState) editor.restoreViewState(quickCssViewState);
    globalThis.getQuickCssState = () => ({ css: editor.getValue(), viewState: editor.saveViewState() });
    editor.onDidChangeModelContent(() =>
        setCss(editor.getValue())
    );
    const onResize = () => {
        // make monaco re-layout
        editor.layout();
    };
    window.addEventListener("resize", onResize);
    const dispose = () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pagehide", dispose);
        const model = editor.getModel();
        editor.dispose();
        model?.dispose();
    };
    globalThis.disposeQuickCss = dispose;
    window.addEventListener("pagehide", dispose, { once: true });
});
