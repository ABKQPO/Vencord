/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { checkPluginLocalization } from "./checkPluginLocalization";

const parameters = (text: string) => Array.from(new Set(Array.from(text.matchAll(/\{(\w+)\}/g), match => match[1]))).sort().join(",");

export function compareCatalogs(english: unknown, chinese: unknown, path = ""): string[] {
    if (typeof english === "string") {
        if (typeof chinese !== "string" || !chinese.trim()) return [`${path}: missing or invalid Chinese string`];
        return parameters(english) === parameters(chinese) ? [] : [`${path}: interpolation parameters differ`];
    }
    if (!english || typeof english !== "object" || !chinese || typeof chinese !== "object" || Array.isArray(english) || Array.isArray(chinese))
        return [`${path}: expected catalog objects`];
    const source = english as Record<string, unknown>;
    const target = chinese as Record<string, unknown>;
    return [
        ...Object.keys(source).flatMap(key => compareCatalogs(source[key], target[key], path ? `${path}.${key}` : key)),
        ...Object.keys(target).filter(key => !Object.hasOwn(source, key)).map(key => `${path}.${key}: no English source`)
    ];
}

function filesIn(directory: string): string[] {
    if (!existsSync(directory)) return [];
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
        ? filesIn(join(directory, entry.name))
        : /\.tsx?$/.test(entry.name) ? [join(directory, entry.name)] : []);
}

export function checkLocalization(root = resolve(dirname(fileURLToPath(import.meta.url)), "..")): string[] {
    const errors: string[] = [];
    const catalogs = join(root, "src/locales");
    const english: Record<string, string> = {};
    const pluginCatalog = JSON.parse(readFileSync(join(catalogs, "en-US/plugins.json"), "utf8"));
    for (const file of readdirSync(join(catalogs, "en-US"))) {
        if (!file.endsWith(".json")) continue;
        const source = JSON.parse(readFileSync(join(catalogs, "en-US", file), "utf8"));
        const chineseFile = join(catalogs, "zh-CN", file);
        if (!existsSync(chineseFile)) { errors.push(`${file}: missing Chinese catalog`); continue; }
        const chinese = JSON.parse(readFileSync(chineseFile, "utf8"));
        errors.push(...compareCatalogs(source, chinese, file));
        if (file === "plugins.json") continue;
        for (const [key, value] of Object.entries(source)) {
            if (Object.hasOwn(english, key)) errors.push(`${file}: duplicate key ${key}`);
            if (typeof value !== "string" || !value.trim()) errors.push(`${file}.${key}: invalid English string`);
            else english[key] = value;
        }
    }
    const usedPlugins = new Set<string>();
    let messages = 0;
    for (const file of filesIn(join(root, "src"))) {
        const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
        const report = (node: ts.Node, message: string) => errors.push(`${relative(root, file)}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}: ${message}`);
        const verify = (node: ts.Node, key: string, fallback: string) => {
            messages++;
            if (!Object.hasOwn(english, key)) report(node, `missing catalog key ${key}`);
            else if (english[key] !== fallback) report(node, `English fallback differs for ${key}`);
        };
        function visit(node: ts.Node) {
            if (ts.isCallExpression(node) && node.expression.getText(source) === "tr" && node.arguments.length >= 2) {
                const [key, fallback] = node.arguments;
                if (ts.isStringLiteralLike(key) && ts.isStringLiteralLike(fallback)) verify(node, key.text, fallback.text);
            }
            if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "LocalizedText") {
                const props = Object.fromEntries(node.attributes.properties.filter(ts.isJsxAttribute).flatMap(attribute =>
                    attribute.initializer && ts.isStringLiteral(attribute.initializer) ? [[attribute.name.getText(source), attribute.initializer.text]] : []));
                if (props.id && props.fallback) verify(node, props.id, props.fallback);
            }
            if (ts.isCallExpression(node) && node.expression.getText(source) === "definePlugin" && node.arguments[0] && ts.isObjectLiteralExpression(node.arguments[0])) {
                const props = Object.fromEntries(node.arguments[0].properties.filter(ts.isPropertyAssignment).flatMap(property =>
                    ts.isStringLiteralLike(property.initializer) ? [[property.name.getText(source), property.initializer.text]] : []));
                if (props.name) {
                    usedPlugins.add(props.name);
                    const entry = pluginCatalog[props.name];
                    if (!entry) report(node, `missing metadata for ${props.name}`);
                    else if (entry.description !== props.description) report(node, `plugin description differs for ${props.name}`);
                }
            }
            ts.forEachChild(node, visit);
        }
        visit(source);
    }
    if (!messages) errors.push("No localized messages were found");
    if (!usedPlugins.size) errors.push("No plugin metadata was found");
    errors.push(...checkPluginLocalization(root));
    return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const errors = checkLocalization();
    if (errors.length) {
        console.error(errors.join("\n"));
        process.exitCode = 1;
    } else console.log("Bilingual catalogs, placeholders, source fallbacks and plugin metadata verified.");
}
