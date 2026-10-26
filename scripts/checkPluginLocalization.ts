/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

/** Static evaluation deliberately never executes plugin code or imports Discord. */
class StaticSource {
    private files = new Map<string, ts.SourceFile>();
    private resolving = new Set<string>();

    file(path: string): ts.SourceFile {
        path = resolve(path);
        if (!this.files.has(path)) this.files.set(path, ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true));
        return this.files.get(path)!;
    }

    value(node: ts.Node | undefined, locals: Record<string, any> = {}): any {
        if (!node) throw new Error("Missing expression");
        const value = (n: ts.Node | undefined) => this.value(n, locals);
        if (ts.isStringLiteralLike(node)) return node.text;
        if (ts.isNumericLiteral(node)) return Number(node.text);
        if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
        if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
        if (node.kind === ts.SyntaxKind.NullKeyword) return null;
        if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) return value(node.expression);
        if (ts.isIdentifier(node)) {
            if (Object.hasOwn(locals, node.text)) return locals[node.text];
            if (node.text === "undefined") return undefined;
            if (node.text === "Object") return Object;
            if (node.text === "String") return String;
            if (node.text === "Number") return Number;
            if (node.text === "wordsFromPascal") return (text: string) => text.split(/(?=[A-Z])/).map(w => w.toLowerCase());
            if (node.text === "wordsToTitle") return (words: string[]) => words.map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
            return this.symbol(node.getSourceFile(), node.text);
        }
        if (ts.isArrayLiteralExpression(node)) return node.elements.flatMap(item => ts.isSpreadElement(item) ? value(item.expression) : [value(item)]);
        if (ts.isObjectLiteralExpression(node)) {
            const result: Record<string, any> = {};
            for (const property of node.properties) {
                if (ts.isSpreadAssignment(property)) Object.assign(result, value(property.expression));
                else if (ts.isPropertyAssignment(property)) result[property.name.getText().replace(/^["']|["']$/g, "")] = value(property.initializer);
                else if (ts.isShorthandPropertyAssignment(property)) result[property.name.text] = value(property.name);
            }
            return result;
        }
        if (ts.isPropertyAccessExpression(node)) {
            const target = value(node.expression);
            const member = target[node.name.text];
            return typeof member === "function" ? member.bind(target) : member;
        }
        if (ts.isElementAccessExpression(node)) return value(node.expression)[value(node.argumentExpression)];
        if (ts.isPrefixUnaryExpression(node)) {
            if (node.operator === ts.SyntaxKind.MinusToken) return -value(node.operand);
            if (node.operator === ts.SyntaxKind.ExclamationToken) return !value(node.operand);
        }
        if (ts.isBinaryExpression(node)) {
            const a = value(node.left), b = value(node.right);
            switch (node.operatorToken.kind) {
                case ts.SyntaxKind.PlusToken: return a + b;
                case ts.SyntaxKind.MinusToken: return a - b;
                case ts.SyntaxKind.BarToken: return a | b;
                case ts.SyntaxKind.LessThanLessThanToken: return a << b;
                case ts.SyntaxKind.EqualsEqualsEqualsToken: return a === b;
                case ts.SyntaxKind.ExclamationEqualsEqualsToken: return a !== b;
            }
        }
        if (ts.isConditionalExpression(node)) return value(value(node.condition) ? node.whenTrue : node.whenFalse);
        if (ts.isTemplateExpression(node)) return node.head.text + node.templateSpans.map(span => String(value(span.expression)) + span.literal.text).join("");
        if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node)) {
            return (...args: any[]) => {
                const scope = { ...locals };
                node.parameters.forEach((p, i) => { scope[p.name.getText()] = args[i]; });
                if (!node.body) throw new Error("Missing function body");
                if (!ts.isBlock(node.body)) return this.value(node.body, scope);
                const statement = node.body.statements.find(ts.isReturnStatement);
                return this.value(statement?.expression, scope);
            };
        }
        if (ts.isCallExpression(node)) {
            // Translation getters may be used in source options: English fallback is the source label.
            if (node.expression.getText() === "tr") return value(node.arguments[1]);
            return value(node.expression)(...node.arguments.map(value));
        }
        throw new Error("Not statically resolvable: " + node.getText().slice(0, 100));
    }

    private symbol(file: ts.SourceFile, name: string): any {
        const identity = file.fileName + "#" + name;
        if (this.resolving.has(identity)) throw new Error("Circular static symbol " + name);
        this.resolving.add(identity);
        try {
            for (const statement of file.statements) {
                if (ts.isVariableStatement(statement)) for (const d of statement.declarationList.declarations) if (d.name.getText() === name) return this.value(d.initializer);
                if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) return this.value(statement);
                if (ts.isEnumDeclaration(statement) && statement.name.text === name) {
                    const result: Record<string, any> = {};
                    let next = 0;
                    for (const member of statement.members) {
                        const current = member.initializer ? this.value(member.initializer, result) : next;
                        result[member.name.getText().replace(/^["']|["']$/g, "")] = current;
                        next = Number(current) + 1;
                    }
                    return result;
                }
                if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text.startsWith(".")) {
                    const bindings = statement.importClause?.namedBindings;
                    if (!bindings || !ts.isNamedImports(bindings)) continue;
                    const imported = bindings.elements.find(e => e.name.text === name);
                    if (!imported) continue;
                    const base = resolve(dirname(file.fileName), statement.moduleSpecifier.text);
                    const target = [base + ".ts", base + ".tsx", join(base, "index.ts"), join(base, "index.tsx")].find(existsSync);
                    if (target) return this.symbol(this.file(target), imported.propertyName?.text ?? imported.name.text);
                }
            }
            throw new Error("Unknown static symbol " + name);
        } finally {
            this.resolving.delete(identity);
        }
    }
}

function sourceFiles(directory: string): string[] {
    if (!existsSync(directory)) return [];
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
        ? sourceFiles(join(directory, entry.name))
        : /\.tsx?$/.test(entry.name) ? [join(directory, entry.name)] : []);
}

const property = (object: ts.ObjectLiteralExpression, key: string) => object.properties.find((p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && p.name.getText().replace(/^["']|["']$/g, "") === key)?.initializer;

/** Check fresh source, independent of the generated inventory and of catalog parity. */
export function checkPluginLocalization(root = resolve(dirname(fileURLToPath(import.meta.url)), "..")): string[] {
    const errors: string[] = [];
    const catalogs = ["en-US", "zh-CN"].map(locale => ({ locale, data: JSON.parse(readFileSync(join(root, "src/locales", locale, "plugins.json"), "utf8")) }));
    const evaluator = new StaticSource();
    for (const parent of ["src/plugins", "src/userplugins"]) {
        const directory = join(root, parent);
        if (!existsSync(directory)) continue;
        const pluginDirectories = readdirSync(directory, { withFileTypes: true }).filter(e => e.isDirectory()).flatMap(e => e.name === "_api" || e.name === "_core"
            ? readdirSync(join(directory, e.name), { withFileTypes: true }).map(child => child.isDirectory() ? join(directory, e.name, child.name) : join(directory, e.name, child.name))
            : [join(directory, e.name)]);
        for (const pluginDirectory of pluginDirectories) {
            const files = existsSync(pluginDirectory) && /\.tsx?$/.test(pluginDirectory) ? [pluginDirectory] : sourceFiles(pluginDirectory);
            let name: string | undefined;
            const definitions: ts.ObjectLiteralExpression[] = [];
            for (const path of files) {
                const file = evaluator.file(path);
                const visit = (node: ts.Node) => {
                    if (ts.isCallExpression(node) && node.arguments[0] && ts.isObjectLiteralExpression(node.arguments[0])) {
                        if (node.expression.getText() === "definePlugin") {
                            const id = property(node.arguments[0], "name");
                            if (id && ts.isStringLiteralLike(id)) name = id.text;
                        }
                        if (node.expression.getText() === "definePluginSettings") definitions.push(node.arguments[0]);
                    }
                    ts.forEachChild(node, visit);
                };
                visit(file);
            }
            if (!name) continue;
            // PlatformIndicators generates real settings from this source-owned descriptor map.
            // Read its keys afresh, so adding another generated location requires translations.
            if (name === "PlatformIndicators") {
                for (const path of files) {
                    const file = evaluator.file(path);
                    for (const statement of file.statements) {
                        if (!ts.isVariableStatement(statement)) continue;
                        for (const declaration of statement.declarationList.declarations) {
                            if (declaration.name.getText() !== "indicatorLocations" || !declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) continue;
                            for (const location of declaration.initializer.properties) {
                                if (!ts.isPropertyAssignment(location)) continue;
                                const key = location.name.getText().replace(/^["']|["']$/g, "");
                                for (const { locale, data } of catalogs) {
                                    const entry = data[name]?.settings?.[key];
                                    if (typeof entry?.name !== "string" || !entry.name.trim() || typeof entry.description !== "string" || !entry.description.trim()) errors.push(name + "." + key + ": missing " + locale + " generated setting translation");
                                }
                            }
                        }
                    }
                }
            }
            for (const definition of definitions) for (const setting of definition.properties) {
                if (!ts.isPropertyAssignment(setting) || !ts.isObjectLiteralExpression(setting.initializer)) continue;
                const key = setting.name.getText().replace(/^["']|["']$/g, "");
                const type = property(setting.initializer, "type")?.getText();
                if (!type?.startsWith("OptionType.")) continue;
                const location = name + "." + key;
                const options = property(setting.initializer, "options");
                let resolvedOptions: { label: unknown; value: unknown; }[] | undefined;
                if (options) {
                    try { resolvedOptions = evaluator.value(options); } catch { /* Dynamic external data uses its runtime labels. */ }
                }
                for (const { locale, data } of catalogs) {
                    const entry = data[name]?.settings?.[key];
                    if (!entry) { errors.push(`${location}: missing ${locale} setting translation`); continue; }
                    if (type !== "OptionType.COMPONENT" && type !== "OptionType.CUSTOM" && (typeof entry.name !== "string" || !entry.name.trim())) errors.push(`${location}: missing ${locale} setting title`);
                    for (const field of ["description", "placeholder"] as const) {
                        const source = property(setting.initializer, field);
                        if (source && (typeof entry[field] !== "string" || !entry[field].trim())) errors.push(`${location}: missing ${locale} ${field}`);
                    }
                    if (Array.isArray(resolvedOptions)) for (const option of resolvedOptions) {
                        const valueKey = `${typeof option.value}:${String(option.value)}`;
                        if (typeof entry.options?.[valueKey] !== "string" || (option.label !== "" && !entry.options[valueKey].trim())) errors.push(`${location}: missing ${locale} option ${valueKey}`);
                        else if (locale === "en-US" && entry.options[valueKey] !== option.label) errors.push(`${location}: English option ${valueKey} differs from source`);
                    }
                }
            }
        }
    }
    return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const errors = checkPluginLocalization();
    if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
    else console.log("Source plugin settings and resolvable typed options are present in both catalogs.");
}
