/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { downloadSettingsBackup, uploadSettingsBackup } from "@api/SettingsSync/offline";
import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { tr, useLocale } from "@utils/localization";
import { Margins } from "@utils/margins";
import { Button, Text } from "@webpack/common";

function BackupAndRestoreTab() {
    useLocale();
    return (
        <SettingsTab>
            <Flex flexDirection="column" gap="0.5em">
                <Card variant="warning">
                    <Heading tag="h4">{tr("loader.settings.warning", "Warning")}</Heading>
                    <Paragraph>{tr("loader.settings.importing.a.settings.file.will.overwrite.your.current.settings", "Importing a settings file will overwrite your current settings.")}</Paragraph>
                </Card>

                <Text variant="text-md/normal" className={Margins.bottom8}>
                    {tr("loader.settings.you.can.import.and.export.your.vencord.settings.as.a.json.file.this.allows.you.to.easily.transf", "You can import and export your Vencord settings as a JSON file. This allows you to easily transfer your settings to another device, or recover your settings after reinstalling Vencord or Discord.")}</Text>

                <Heading tag="h4">{tr("loader.settings.settings.export.contains", "Settings Export contains:")}</Heading>
                <Text variant="text-md/normal" className={Margins.bottom8}>
                    <ul>
                        <li>{tr("loader.settings.mdash.custom.quickcss", "— Custom QuickCSS")}</li>
                        <li>{tr("loader.settings.mdash.theme.links", "— Theme Links")}</li>
                        <li>{tr("loader.settings.mdash.plugin.settings", "— Plugin Settings")}</li>
                    </ul>
                </Text>

                <Flex>
                    <Button onClick={() => uploadSettingsBackup()}>
                        {tr("loader.settings.import.settings", "Import Settings")}</Button>
                    <Button onClick={downloadSettingsBackup}>
                        {tr("loader.settings.export.settings", "Export Settings")}</Button>
                </Flex>
            </Flex>
        </SettingsTab >
    );
}

export default wrapTab(BackupAndRestoreTab, "Backup & Restore");
