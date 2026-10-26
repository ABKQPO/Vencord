/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NativeSettings } from "@main/settings";
import { IpcEvents } from "@shared/IpcEvents";
import { nativeMessage } from "@shared/nativeLocalization";
import { dialog, ipcMain, IpcMainInvokeEvent } from "electron";

import { CspPolicies, ImageAndCssSrc } from ".";

export type CspRequestResult = "invalid" | "cancelled" | "unchecked" | "ok" | "conflict";

export function registerCspIpcHandlers() {
    ipcMain.handle(IpcEvents.CSP_REMOVE_OVERRIDE, removeCspRule);
    ipcMain.handle(IpcEvents.CSP_REQUEST_ADD_OVERRIDE, addCspRule);
    ipcMain.handle(IpcEvents.CSP_IS_DOMAIN_ALLOWED, isDomainAllowed);
}

function validate(url: string, directives: string[]) {
    try {
        const { host } = new URL(url);

        if (/[;'"\\]/.test(host)) return false;
    } catch {
        return false;
    }

    if (directives.length === 0) return false;
    if (directives.some(d => !ImageAndCssSrc.includes(d))) return false;

    return true;
}

function getMessage(url: string, directives: string[], callerName: string, locale?: string) {
    const domain = new URL(url).host;

    const message = nativeMessage(locale, "native.csp.message", { caller: callerName, domain });

    let detail = nativeMessage(locale, "native.csp.trustWarning", { domain, client: IS_DISCORD_DESKTOP ? "Discord" : "Vesktop" });

    if (directives.length === 1 && directives[0] === "connect-src") {
        return { message, detail };
    }

    const contentTypes = directives
        .filter(type => type !== "connect-src")
        .map(type => {
            switch (type) {
                case "img-src":
                    return nativeMessage(locale, "native.csp.images");
                case "style-src":
                    return nativeMessage(locale, "native.csp.styles");
                case "font-src":
                    return nativeMessage(locale, "native.csp.fonts");
                default:
                    throw new Error(`Illegal CSP directive: ${type}`);
            }
        })
        .sort()
        .join(", ");

    detail = nativeMessage(locale, "native.csp.contentWarning", { domain, types: contentTypes, warning: detail });

    return { message, detail };
}

async function addCspRule(_: IpcMainInvokeEvent, url: string, directives: string[], callerName: string, locale?: string): Promise<CspRequestResult> {
    if (!validate(url, directives)) {
        return "invalid";
    }

    const domain = new URL(url).host;

    if (domain in NativeSettings.store.customCspRules) {
        return "conflict";
    }

    const { checkboxChecked, response } = await dialog.showMessageBox({
        ...getMessage(url, directives, callerName, locale),
        type: callerName ? "info" : "warning",
        title: nativeMessage(locale, "native.csp.title"),
        buttons: [nativeMessage(locale, "native.csp.cancel"), nativeMessage(locale, "native.csp.allow")],
        defaultId: 0,
        cancelId: 0,
        checkboxLabel: nativeMessage(locale, "native.csp.trustCheckbox", { domain }),
        checkboxChecked: false,
    });

    if (response !== 1) {
        return "cancelled";
    }

    if (!checkboxChecked) {
        return "unchecked";
    }

    NativeSettings.store.customCspRules[domain] = directives;
    return "ok";
}

function removeCspRule(_: IpcMainInvokeEvent, domain: string) {
    if (domain in NativeSettings.store.customCspRules) {
        delete NativeSettings.store.customCspRules[domain];
        return true;
    }

    return false;
}

function isDomainAllowed(_: IpcMainInvokeEvent, url: string, directives: string[]) {
    try {
        const domain = new URL(url).host;

        const ruleForDomain = CspPolicies[domain] ?? NativeSettings.store.customCspRules[domain];
        if (!ruleForDomain) return false;

        return directives.every(d => ruleForDomain.includes(d));
    } catch (e) {
        return false;
    }
}
