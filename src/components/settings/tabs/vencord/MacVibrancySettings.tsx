/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { IS_MAC } from "@utils/constants";
import { tr, useLocale } from "@utils/localization";
import { Margins } from "@utils/margins";
import { identity } from "@utils/misc";
import { Forms, Select } from "@webpack/common";

export function MacOSVibrancySettings() {
    useLocale();
    const settings = useSettings(["macosVibrancyStyle"]);

    if (!IS_MAC || IS_WEB) return null;

    return (
        <ErrorBoundary noop>
            <Forms.FormTitle tag="h5">{tr("loader.settings.macos.window.vibrancy.style.requires.restart", "MacOS Window vibrancy style (requires restart)")}</Forms.FormTitle>
            <Select
                className={Margins.bottom20}
                placeholder={tr("loader.settings.window.vibrancy.style", "Window vibrancy style")}
                options={[
                    // Sorted from most opaque to most transparent
                    {
                        label: tr("loader.settings.no.vibrancy", "No vibrancy"), value: undefined
                    },
                    {
                        label: tr("loader.settings.under.page.window.tinting", "Under Page (window tinting)"),
                        value: "under-page"
                    },
                    {
                        label: tr("loader.settings.content", "Content"),
                        value: "content"
                    },
                    {
                        label: tr("loader.settings.window", "Window"),
                        value: "window"
                    },
                    {
                        label: tr("loader.settings.selection", "Selection"),
                        value: "selection"
                    },
                    {
                        label: tr("loader.settings.titlebar", "Titlebar"),
                        value: "titlebar"
                    },
                    {
                        label: tr("loader.settings.header", "Header"),
                        value: "header"
                    },
                    {
                        label: tr("loader.settings.sidebar", "Sidebar"),
                        value: "sidebar"
                    },
                    {
                        label: tr("loader.settings.tooltip", "Tooltip"),
                        value: "tooltip"
                    },
                    {
                        label: tr("loader.settings.menu", "Menu"),
                        value: "menu"
                    },
                    {
                        label: tr("loader.settings.popover", "Popover"),
                        value: "popover"
                    },
                    {
                        label: tr("loader.settings.fullscreen.ui.transparent.but.slightly.muted", "Fullscreen UI (transparent but slightly muted)"),
                        value: "fullscreen-ui"
                    },
                    {
                        label: tr("loader.settings.hud.most.transparent", "HUD (Most transparent)"),
                        value: "hud"
                    },
                ]}
                select={v => settings.macosVibrancyStyle = v}
                isSelected={v => settings.macosVibrancyStyle === v}
                serialize={identity}
            />
        </ErrorBoundary>
    );
}
