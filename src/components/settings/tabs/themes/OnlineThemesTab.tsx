/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useSettings } from "@api/Settings";
import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { tr, useLocale } from "@utils/localization";
import { Forms, TextArea, useState } from "@webpack/common";

export function OnlineThemesTab() {
    useLocale();
    const settings = useSettings(["themeLinks"]);

    const [themeText, setThemeText] = useState(settings.themeLinks.join("\n"));

    // When the user leaves the online theme textbox, update the settings
    function onBlur() {
        settings.themeLinks = [...new Set(
            themeText
                .trim()
                .split(/\n+/)
                .map(s => s.trim())
                .filter(Boolean)
        )];
    }

    return (
        <Flex flexDirection="column" gap="1em">
            <Card variant="warning" defaultPadding>
                <Forms.FormText size="md">
                    {tr("loader.settings.this.section.is.for.advanced.users.if.you.are.having.difficulties.using.it.use.the.local.themes", "This section is for advanced users. If you are having difficulties using it, use the Local Themes tab instead.")}</Forms.FormText>
            </Card>
            <Card>
                <Forms.FormTitle tag="h5">{tr("loader.settings.paste.links.to.css.files.here", "Paste links to css files here")}</Forms.FormTitle>
                <Forms.FormText>{tr("loader.settings.one.link.per.line", "One link per line")}</Forms.FormText>
                <Forms.FormText>{tr("loader.settings.you.can.prefix.lines.with.light.or.dark.to.toggle.them.based.on.your.discord.theme", "You can prefix lines with @light or @dark to toggle them based on your Discord theme")}</Forms.FormText>
                <Forms.FormText>{tr("loader.settings.make.sure.to.use.direct.links.to.files.raw.or.github.io", "Make sure to use direct links to files (raw or github.io)!")}</Forms.FormText>
            </Card>

            <section>
                <Forms.FormTitle tag="h5">{tr("loader.settings.online.themes", "Online Themes")}</Forms.FormTitle>
                <TextArea
                    value={themeText}
                    onChange={setThemeText}
                    className={"vc-settings-theme-links"}
                    placeholder={tr("loader.settings.enter.theme.links", "Enter Theme Links...")}
                    spellCheck={false}
                    onBlur={onBlur}
                    rows={10}
                />
            </section>
        </Flex>
    );
}
