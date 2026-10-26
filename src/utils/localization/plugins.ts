/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Plugin, PluginSettingDef, PluginTag } from "@utils/types";

import { pluginMessages } from "../../locales";
import { tr } from ".";
import { Locale, localizeSetting, PluginTranslation } from "./core";
import { getLocale } from "./runtime";

const catalogs = pluginMessages as Record<Locale, Record<string, PluginTranslation>>;

export function getPluginDisplayName(plugin: Pick<Plugin, "name">, locale = getLocale()): string {
    return catalogs[locale][plugin.name]?.name ?? plugin.name;
}

export function getPluginDescription(plugin: Pick<Plugin, "name" | "description">, locale = getLocale()): string {
    return catalogs[locale][plugin.name]?.description ?? plugin.description;
}

export function getLocalizedSetting<T extends PluginSettingDef>(plugin: Pick<Plugin, "name">, key: string, setting: T, locale = getLocale()): T {
    const localized = localizeSetting(setting, catalogs[locale][plugin.name]?.settings[key]);
    if (plugin.name === "Translate" && key === "service" && "description" in setting && setting.description.includes("(not available on web)"))
        return { ...localized, description: tr("plugins.Translate.providerUnavailableOnWeb", "Translation provider (not available on web)") };
    return localized;
}

export function getPluginSearchText(plugin: Pick<Plugin, "name" | "description" | "searchTerms">): string[] {
    return [plugin.name, plugin.description, plugin.name.match(/[A-Z]/g)?.join("") ?? "", ...(plugin.searchTerms ?? []),
        getPluginDisplayName(plugin, "zh-CN"), getPluginDescription(plugin, "zh-CN")];
}

export function getPluginTagLabel(tag: PluginTag): string {
    const labels: Record<PluginTag, string> = {
        Accessibility: tr("plugins.tag.Accessibility", "Accessibility"),
        Activity: tr("plugins.tag.Activity", "Activity"),
        Appearance: tr("plugins.tag.Appearance", "Appearance"),
        Chat: tr("plugins.tag.Chat", "Chat"),
        Commands: tr("plugins.tag.Commands", "Commands"),
        Console: tr("plugins.tag.Console", "Console"),
        Customisation: tr("plugins.tag.Customisation", "Customisation"),
        Developers: tr("plugins.tag.Developers", "Developers"),
        Emotes: tr("plugins.tag.Emotes", "Emotes"),
        Friends: tr("plugins.tag.Friends", "Friends"),
        Fun: tr("plugins.tag.Fun", "Fun"),
        Media: tr("plugins.tag.Media", "Media"),
        Notifications: tr("plugins.tag.Notifications", "Notifications"),
        Organisation: tr("plugins.tag.Organisation", "Organisation"),
        Privacy: tr("plugins.tag.Privacy", "Privacy"),
        Reactions: tr("plugins.tag.Reactions", "Reactions"),
        Roles: tr("plugins.tag.Roles", "Roles"),
        Servers: tr("plugins.tag.Servers", "Servers"),
        Shortcuts: tr("plugins.tag.Shortcuts", "Shortcuts"),
        Utility: tr("plugins.tag.Utility", "Utility"),
        Voice: tr("plugins.tag.Voice", "Voice")
    };
    return labels[tag];
}
