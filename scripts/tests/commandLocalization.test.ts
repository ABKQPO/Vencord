/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function commandHarness() {
    let locale = "en-US";
    const dictionary = JSON.parse(readFileSync(new URL("../../src/locales/zh-CN/commands.json", import.meta.url), "utf8"));
    const cache = new Map<string, { exports: any; }>();
    function load(file: string) {
        if (cache.has(file)) return cache.get(file)!.exports;
        const module = { exports: {} as any };
        cache.set(file, module);
        const code = ts.transpileModule(readFileSync(new URL("../../" + file, import.meta.url), "utf8"), {
            compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
        }).outputText;
        const requireModule = (name: string) => {
            switch (name) {
                case "./commandHelpers": return load("src/api/Commands/commandHelpers.ts");
                case "./types": return { ApplicationCommandOptionType: { SUB_COMMAND: 1 }, ApplicationCommandType: { CHAT_INPUT: 1 }, ApplicationCommandInputType: { BUILT_IN_TEXT: 0 } };
                case "@utils/localization": return { tr: (key: string, fallback: string) => locale === "zh-CN" ? dictionary[key] ?? fallback : fallback };
                case "@utils/Logger": return { Logger: class { error() { } } };
                case "@utils/mergeDefaults": return { mergeDefaults: (first: object, second: object) => ({ ...second, ...first }) };
                case "@utils/text": return { makeCodeblock: (value: string) => value };
                case "@webpack": return { findByCodeLazy: () => () => ({}) };
                case "@webpack/common": return { SnowflakeUtils: { fromTimestamp: () => 1 }, MessageActions: { receiveMessage() { } } };
                default: throw new Error("Unexpected dependency: " + name);
            }
        };
        runInNewContext(code, { module, exports: module.exports, require: requireModule, console, Promise, Object, Symbol, Date }, { filename: file });
        return module.exports;
    }
    return { api: load("src/api/Commands/index.ts"), dictionary, setLocale: (value: string) => locale = value };
}

test("command descriptions refresh with locale while shared options and routing stay stable", () => {
    const { api, dictionary, setLocale } = commandHarness();
    const shared = { name: "message", description: "message", type: 3 };
    api._init([{ name: "shrug", displayName: "shrug", id: "-1", options: [shared] }, { name: "me", displayName: "me", id: "-2", options: [shared] }]);
    const command = { name: "petpet", description: "Create a petpet gif. You can only specify one of the image options", options: [{ name: "delay", description: "delay", type: 4 }, api.OptionalMessageOption], execute() { } } as any;
    api.registerCommand(command, "petpet");
    assert.equal(command.displayDescription, command.description);
    assert.notEqual(command.options[1], shared);
    assert.equal(Object.getOwnPropertyDescriptor(shared, "displayDescription"), undefined);
    setLocale("zh-CN");
    assert.equal(command.displayDescription, dictionary["commands.petpet.petpet.description"]);
    assert.equal(command.options[0].displayDescription, dictionary["commands.petpet.petpet.delay.description"]);
    assert.equal(command.name, "petpet");
    assert.equal(command.options[0].name, "delay");
    assert.equal(command.options[1].name, "message");
});

test("custom text, explicit getters, and subcommand descriptions survive registration", () => {
    const { api, setLocale } = commandHarness();
    api._init([{ name: "shrug", id: "-1", options: [{}] }, { name: "me", id: "-2", options: [{}] }]);
    const custom = { name: "petpet", description: "my own tag text", options: [], execute() { } } as any;
    api.registerCommand(custom, "CustomCommands");
    setLocale("zh-CN");
    assert.equal(custom.displayDescription, "my own tag text");
    const root = { name: "tags", description: "Manage tags", options: [{ name: "create", type: 1, get description() { return localeDescription(); } }], execute() { } };
    let translated = false;
    function localeDescription() { return translated ? "创建标签" : "Create tag"; }
    api.registerCommand(root, "CustomCommands");
    const sub = api.commands["tags create"];
    assert.equal(sub.displayDescription, "Create tag");
    translated = true;
    assert.equal(sub.displayDescription, "创建标签");
    assert.equal(sub.name, "tags create");
    assert.equal(sub.subCommandPath[0].name, "create");
    const explicit = { description: "source", get displayDescription() { return localeDescription(); } };
    api.prepareCommandDescription(explicit, "petpet", "petpet");
    assert.equal(explicit.displayDescription, "创建标签");
});
