/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Heading } from "@components/Heading";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { IS_WINDOWS } from "@utils/constants";
import { tr, useLocale } from "@utils/localization";
import { Select } from "@webpack/common";

export function WindowsMaterialSettings() {
    useLocale();
    const settings = useSettings(["windowsMaterial"]);

    if (!IS_WINDOWS || IS_WEB || !VencordNative.native.supportsWindowsMaterial()) return null;

    return (
        <ErrorBoundary noop>
            <Heading tag="h5">{tr("loader.settings.background.material", "Background Material")}</Heading>
            <Paragraph className={Margins.bottom8}>
                {tr("loader.settings.windows.transparent.background.effects.you.need.a.theme.that.supports.transparency.or.this.will", "Windows transparent background effects. You need a theme that supports transparency or this will do nothing. A restart is required after changing this setting.")}</Paragraph>

            <Select
                placeholder={tr("loader.settings.none", "None")}
                options={[
                    {
                        label: tr("loader.settings.none", "None"),
                        value: "none",
                        default: true
                    },
                    {
                        label: tr("loader.settings.mica.incorporates.system.theme.desktop.wallpaper.to.paint.the.background", "Mica (incorporates system theme + desktop wallpaper to paint the background)"),
                        value: "mica"
                    },
                    {
                        label: tr("loader.settings.tabbed.variant.of.mica.with.stronger.background.tinting", "Tabbed (variant of Mica with stronger background tinting)"),
                        value: "tabbed"
                    },
                    {
                        label: tr("loader.settings.acrylic.blurs.the.window.behind.vesktop.for.a.translucent.background", "Acrylic (blurs the window behind Vesktop for a translucent background)"),
                        value: "acrylic"
                    }
                ]}
                closeOnSelect={true}
                select={v => (settings.windowsMaterial = v)}
                isSelected={v => v === settings.windowsMaterial}
                serialize={s => s}
            />
        </ErrorBoundary>
    );
}
