/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { build } from "esbuild";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

import chinese from "../../src/locales/zh-CN/native.json";
import { nativeMessage } from "../../src/shared/nativeLocalization";

test("native messages use the renderer locale and preserve interpolation values", () => {
    assert.equal(nativeMessage("zh-CN", "native.csp.allow"), "允许");
    assert.equal(nativeMessage("en-US", "native.csp.allow"), "Allow");
    assert.equal(nativeMessage(undefined, "native.csp.allow"), "Allow");
    assert.equal(nativeMessage("zh-TW", "native.csp.allow"), "Allow");
    assert.equal(nativeMessage("zh-CN", "native.csp.message", { caller: "$& {domain}", domain: "test.example" }), "$& {domain} 希望允许连接到 test.example");
    assert.equal(Object.keys(chinese).length, 14);
});

test("localized CSP prompts retain validation, cancellation and explicit trust requirements", async () => {
    const handlers = new Map<string, (...args: any[]) => Promise<string>>();
    let choice = { response: 0, checkboxChecked: false };
    let lastDialog: any;
    const store = { customCspRules: {} as Record<string, string[]> };
    const bundle = await build({
        entryPoints: ["src/main/csp/manager.ts"], bundle: true, write: false, platform: "node", format: "cjs",
        define: { IS_DISCORD_DESKTOP: "true" }, external: ["electron"],
        plugins: [{
            name: "native-test-dependencies",
            setup(builder) {
                builder.onResolve({ filter: /^@main\/settings$/ }, () => ({ path: "settings", namespace: "test" }));
                builder.onResolve({ filter: /^\.$/ }, args => args.importer.endsWith("manager.ts") ? { path: "csp", namespace: "test" } : undefined);
                builder.onLoad({ filter: /.*/, namespace: "test" }, args => ({
                    contents: args.path === "settings"
                        ? "exports.NativeSettings = globalThis.testSettings;"
                        : 'exports.CspPolicies={};exports.ImageAndCssSrc=["connect-src","img-src","style-src","font-src"];',
                    loader: "js"
                }));
            }
        }]
    });
    const context = {
        module: { exports: {} as any }, testSettings: { store }, URL,
        require(name: string) {
            assert.equal(name, "electron");
            return {
                ipcMain: { handle: (name: string, handler: any) => handlers.set(name, handler) },
                dialog: { showMessageBox: async (options: any) => { lastDialog = options; return choice; } }
            };
        }
    };
    runInNewContext(bundle.outputFiles[0].text, context);
    context.module.exports.registerCspIpcHandlers();
    const add = handlers.get("VencordCspRequestAddOverride")!;
    assert.equal(await add({}, "not a url", ["connect-src"], "Test", "zh-CN"), "invalid");
    assert.equal(await add({}, "https://test.example", ["script-src"], "Test", "zh-CN"), "invalid");
    assert.equal(await add({}, "https://test.example", ["connect-src", "img-src", "style-src", "font-src"], "Test", "zh-CN"), "cancelled");
    assert.equal(lastDialog.title, "Vencord 主机权限");
    assert.equal(lastDialog.buttons[0], "取消");
    assert.equal(lastDialog.buttons[1], "允许");
    assert.equal(lastDialog.defaultId, 0);
    assert.equal(lastDialog.cancelId, 0);
    assert.equal(lastDialog.checkboxChecked, false);
    assert.match(lastDialog.detail, /图片/);
    assert.match(lastDialog.detail, /CSS 与主题/);
    assert.match(lastDialog.detail, /字体/);
    assert.match(lastDialog.detail, /完全关闭并重新启动 Discord/);
    assert.match(lastDialog.checkboxLabel, /test.example/);
    assert.deepEqual(store.customCspRules, {});
    choice = { response: 1, checkboxChecked: false };
    assert.equal(await add({}, "https://test.example", ["connect-src"], "Test", "en-US"), "unchecked");
    assert.equal(lastDialog.buttons[0], "Cancel");
    assert.equal(lastDialog.buttons[1], "Allow");
    assert.match(lastDialog.message, /Test wants to allow connections to test.example/);
    assert.deepEqual(store.customCspRules, {});
    choice = { response: 1, checkboxChecked: true };
    assert.equal(await add({}, "https://test.example", ["connect-src"], "Test", "zh-CN"), "ok");
    assert.deepEqual(Array.from(store.customCspRules["test.example"]), ["connect-src"]);
    assert.equal(await add({}, "https://test.example", ["connect-src"], "Test", "zh-CN"), "conflict");
});

test("QuickCSS uses Chinese NLS and saves pending content and view before a locale reload", async () => {
    const html = readFileSync("src/main/monacoWin.html", "utf8");
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
    let config: any, options: any, saved: string | undefined, reloads = 0;
    const editor = {
        getValue: () => ".test { color: red; }",
        saveViewState: () => ({ cursorState: [{ position: { lineNumber: 2, column: 3 } }] }),
        onDidChangeModelContent() { }, layout() { }
    };
    const location = {
        hash: "#" + new URLSearchParams({ locale: "zh-CN", title: "Vencord QuickCSS 编辑器", editorLabel: "QuickCSS 编辑器" }),
        reload: () => reloads++
    };
    const document = { documentElement: {} as any, title: "Vencord QuickCSS Editor", getElementById: () => ({}) };
    const window: any = { addEventListener() { } };
    const require = Object.assign((_deps: string[], callback: () => void) => callback(), { config: (value: any) => config = value });
    runInNewContext(script, {
        URLSearchParams, location, document, window, require,
        getCurrentCss: async () => ".test {}", getTheme: () => "vs-dark", setCss() { },
        VencordNative: { quickCss: { set: async (css: string) => saved = css } },
        monaco: { editor: { create: (_element: unknown, value: any) => { options = value; return editor; } } }
    });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(document.documentElement.lang, "zh-CN");
    assert.equal(document.title, "Vencord QuickCSS 编辑器");
    assert.equal(config["vs/nls"].availableLanguages["*"], "zh-cn");
    assert.equal(options.language, "css");
    assert.equal(options.ariaLabel, "QuickCSS 编辑器");
    assert.equal(options.value, ".test {}");
    await window.setEditorLocale(new URLSearchParams({ locale: "zh-CN" }).toString());
    assert.equal(reloads, 0);
    await window.setEditorLocale(new URLSearchParams({ locale: "en-US", title: "Vencord QuickCSS Editor", editorLabel: "QuickCSS editor" }).toString());
    assert.equal(saved, ".test { color: red; }");
    assert.equal(reloads, 1);
    assert.ok(new URLSearchParams(location.hash).get("viewState"));
});

test("browser QuickCSS loads local NLS before its editor bundle and resets English", () => {
    const html = readFileSync("browser/monacoWin.html", "utf8");
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
    const appended: any[] = [];
    const document = {
        documentElement: {} as any, title: "", getElementById: () => ({}),
        createElement: (tag: string) => ({ tag } as any),
        body: { append: (...elements: any[]) => appended.push(...elements) }
    };
    const context: any = { document, URL, quickCssLocale: "zh-CN", quickCssTitle: "Vencord QuickCSS 编辑器", baseUrl: "https://extension.example" };
    runInNewContext(script, context);
    assert.equal(document.documentElement.lang, "zh-CN");
    assert.equal(document.title, "Vencord QuickCSS 编辑器");
    assert.equal(appended.length, 2);
    assert.match(appended[1].src.toString(), /vendor\/monaco\/nls.zh-cn.js$/);
    appended[1].onload();
    assert.match(appended[2].src.toString(), /vendor\/monaco\/index.js$/);
    context.quickCssLocale = "en-US";
    context.quickCssTitle = "Vencord QuickCSS Editor";
    context._VSCODE_NLS_LANGUAGE = "zh-cn";
    context._VSCODE_NLS_MESSAGES = ["中文"];
    runInNewContext(script, context);
    assert.equal(document.documentElement.lang, "en-US");
    assert.equal(context._VSCODE_NLS_LANGUAGE, undefined);
    assert.equal(context._VSCODE_NLS_MESSAGES, undefined);
    assert.match(appended.at(-1).src.toString(), /vendor\/monaco\/index.js$/);
});

test("browser loader localizes prompts and preserves pending CSS during locale changes", async () => {
    const externals = ["file://monacoWin.html?minify", "@api/DataStore", "@main/themes", "@shared/debounce", "@utils/localStorage", "@utils/web", "@utils/web-metadata"];
    const makeStub = async (userscript: boolean) => {
        const bundle = await build({
            entryPoints: ["browser/VencordNativeStub.ts"], bundle: true, write: false, platform: "node", format: "cjs", external: externals,
            define: { IS_USERSCRIPT: String(userscript) },
            loader: { ".css": "empty" }
        });
        const storage = new Map();
        let prompt = "", alert = "", opened = 0, writes = 0, disposed = 0;
        const originalWorker = () => { };
        const popup: any = {
            closed: false, Worker: originalWorker, focus() { },
            document: { open() { }, close() { }, write: () => writes++ }
        };
        const context: any = {
            module: { exports: {} }, URL, console,
            innerWidth: 1000, innerHeight: 1000,
            confirm: (text: string) => { prompt = text; return false; },
            alert: (text: string) => alert = text,
            open: () => { opened++; return popup; },
            require: (name: string) => {
                if (name === externals[0]) return "<html></html>";
                if (name === "@api/DataStore") return { createStore: () => ({}), get: async (key: string) => storage.get(key), set: async (key: string, value: unknown) => storage.set(key, value) };
                if (name === "@shared/debounce") return { debounce: (fn: unknown) => fn };
                if (name === "@main/themes") return { getThemeInfo() { } };
                if (name === "@utils/localStorage") return { localStorage: { getItem() { } } };
                if (name === "@utils/web") return { getStylusWebStoreUrl: () => "https://stylus.example" };
                if (name === "@utils/web-metadata") return { EXTENSION_BASE_URL: "https://extension.example", metaReady: Promise.resolve(), RENDERER_CSS_URL: "" };
                throw new Error(`Unexpected dependency ${name}`);
            }
        };
        context.window = context;
        runInNewContext(bundle.outputFiles[0].text, context);
        const quickCss = context.VencordNative.quickCss;
        return { quickCss, popup, context, storage, originalWorker, stats: () => ({ prompt, alert, opened, writes, disposed }), onDispose: () => disposed++ };
    };
    const userscript = await makeStub(true);
    await userscript.quickCss.openEditor("zh-CN");
    assert.match(userscript.stats().prompt, /用户脚本不支持 QuickCSS/);
    assert.equal(userscript.stats().opened, 0);
    const stub = await makeStub(false);
    await stub.quickCss.setEditorLocale("zh-CN");
    assert.equal(stub.stats().opened, 0);
    await stub.quickCss.openEditor("zh-CN");
    assert.equal(stub.popup.quickCssLocale, "zh-CN");
    assert.equal(stub.popup.quickCssTitle, "Vencord QuickCSS 编辑器");
    const viewState = { cursor: 4 };
    stub.popup.getQuickCssState = () => ({ css: ".pending { color: red; }", viewState });
    stub.popup.disposeQuickCss = stub.onDispose;
    stub.popup.Worker = () => { };
    await stub.quickCss.setEditorLocale("en-US");
    assert.equal(stub.storage.get("VencordQuickCss"), ".pending { color: red; }");
    assert.equal(await stub.popup.getCurrentCss(), ".pending { color: red; }");
    assert.equal(stub.popup.quickCssViewState, viewState);
    assert.equal(stub.popup.quickCssTitle, "Vencord QuickCSS Editor");
    assert.equal(stub.popup.Worker, stub.originalWorker);
    assert.equal(stub.stats().disposed, 1);
    assert.equal(stub.stats().writes, 2);
    await stub.quickCss.openEditor("en-US");
    assert.equal(stub.stats().opened, 1);
    assert.equal(stub.stats().writes, 2);
    stub.popup.closed = true;
    stub.context.open = () => null;
    await stub.quickCss.openEditor("zh-CN");
    assert.match(stub.stats().alert, /请确保已允许弹出窗口/);
});
