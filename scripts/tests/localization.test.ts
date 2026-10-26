/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

test("the localization engine is available without Discord or React", async () => {
    assert.ok(existsSync(new URL("../../src/utils/localization/core.ts", import.meta.url)), "Missing localization engine");
    const { normalizeLocale, formatMessage, translateMessage, translatePlural, localizeSetting } = await import("../../src/utils/localization/core");

    assert.equal(normalizeLocale("zh-CN"), "zh-CN");
    assert.equal(normalizeLocale("en-GB"), "en-US");
    assert.equal(normalizeLocale("zh-TW"), "en-US");
    assert.equal(normalizeLocale(undefined), "en-US");
    assert.equal(formatMessage("Open {name}: {count}", { name: "$& {count}", count: 2 }), "Open $& {count}: 2");
    assert.equal(formatMessage("Unknown {name}", {}), "Unknown {name}");
    assert.equal(translateMessage("zh-CN", "search", "Search", {}, { search: "搜索" }), "搜索");
    assert.equal(translateMessage("en-US", "search", "Search", {}, { search: "搜索" }), "Search");
    assert.equal(translateMessage("zh-CN", "absent", "Fallback {name}", { name: "Ada" }, {}), "Fallback Ada");
    assert.equal(translatePlural("en-US", 1, "{count} member", "{count} members"), "1 member");
    assert.equal(translatePlural("en-US", 2, "{count} member", "{count} members"), "2 members");
    assert.equal(translatePlural("zh-CN", 2, "{count} 位成员", "{count} 位成员"), "2 位成员");

    const validate = () => true;
    const settings = { displayName: "Theme", description: "Select a theme", default: "dark", options: [{ label: "Dark", value: "dark", default: true }, { label: "One", value: 1 }], isValid: validate };
    const result = localizeSetting(settings, { name: "主题", description: "选择主题", options: { "string:dark": "深色", "number:1": "一" } });
    assert.equal(result.displayName, "主题");
    assert.equal(result.options[0].label, "深色");
    assert.equal(result.options[0].value, "dark");
    assert.equal(result.options[1].value, 1);
    assert.equal(result.default, "dark");
    assert.equal(result.isValid, validate);
    assert.equal(settings.displayName, "Theme");
    assert.equal(settings.options[0].label, "Dark");
    assert.notEqual(result.options, settings.options);
});

test("locale subscriptions update snapshots and unsubscribe without touching settings", async () => {
    const listeners = new Set<() => void>();
    const store = { locale: "en-US", addChangeListener: (fn: () => void) => listeners.add(fn), removeChangeListener: (fn: () => void) => listeners.delete(fn) };
    const previous = (globalThis as any).Vencord;
    (globalThis as any).Vencord = { Webpack: { Common: { LocaleStore: store } } };
    try {
        const { getLocale, subscribeLocale } = await import("../../src/utils/localization/runtime");
        let updates = 0;
        const unsubscribe = subscribeLocale(() => updates++);
        assert.equal(getLocale(), "en-US");
        store.locale = "zh-CN";
        listeners.forEach(fn => fn());
        assert.equal(getLocale(), "zh-CN");
        assert.ok(updates > 0);
        unsubscribe();
        assert.equal(listeners.size, 0);
    } finally {
        (globalThis as any).Vencord = previous;
    }
});

test("catalog verification detects missing translations and placeholder drift", async () => {
    assert.ok(existsSync(new URL("../checkLocalization.ts", import.meta.url)), "Missing catalog verification");
    const { compareCatalogs } = await import("../checkLocalization");
    assert.deepEqual(compareCatalogs({ label: "Open {name}" }, { label: "打开 {name}" }), []);
    assert.ok(compareCatalogs({ label: "Open {name}" }, {}).length > 0);
    assert.ok(compareCatalogs({ label: "Open {name}" }, { label: "打开 {other}" }).length > 0);
    assert.ok(compareCatalogs({ label: "Label" }, { label: {} }).length > 0);
});
