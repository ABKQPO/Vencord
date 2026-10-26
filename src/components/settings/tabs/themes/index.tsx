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

import "./styles.css";

import { BaseText } from "@components/BaseText";
import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { Link } from "@components/Link";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { LocalizedText } from "@components/settings/tabs/LocalizedText";
import { tr, useLocale } from "@utils/localization";
import { getStylusWebStoreUrl } from "@utils/web";
import { Forms, React, TabBar, useState } from "@webpack/common";

import { CspErrorCard } from "./CspErrorCard";
import { LocalThemesTab } from "./LocalThemesTab";
import { OnlineThemesTab } from "./OnlineThemesTab";

const enum ThemeTab {
    LOCAL,
    ONLINE
}

function ThemesTab() {
    useLocale();
    const [currentTab, setCurrentTab] = useState(ThemeTab.LOCAL);

    return (
        <SettingsTab>
            <TabBar
                type="top"
                look="brand"
                className="vc-settings-tab-bar"
                selectedItem={currentTab}
                onItemSelect={setCurrentTab}
            >
                <TabBar.Item
                    className="vc-settings-tab-bar-item"
                    id={ThemeTab.LOCAL}
                >
                    {tr("loader.settings.local.themes", "Local Themes")}</TabBar.Item>
                <TabBar.Item
                    className="vc-settings-tab-bar-item"
                    id={ThemeTab.ONLINE}
                >
                    {tr("loader.settings.online.themes", "Online Themes")}</TabBar.Item>
            </TabBar>

            <Flex flexDirection="column" gap="1em">
                <CspErrorCard />

                <Card variant="warning">
                    <BaseText tag="h3" size="md" weight="medium" className={Margins.bottom8}>{tr("loader.settings.theme.performance", "Theme Performance")}</BaseText>
                    <Paragraph>
                        <LocalizedText id="loader.settings.themes.and.custom.css.have.the.potential.to.cause.major.lag.if.you.experience.performance.issue" fallback="Themes and custom CSS have the potential to cause major lag! If you experience performance issues, try disabling your themes and CSS to see if they are the cause. The most common cause of lag is the {operator} operator." slots={{ operator: <code>:has()</code> }} />
                    </Paragraph>
                </Card>

                {currentTab === ThemeTab.LOCAL && <LocalThemesTab />}
                {currentTab === ThemeTab.ONLINE && <OnlineThemesTab />}
            </Flex>
        </SettingsTab>
    );
}

function UserscriptThemesTab() {
    useLocale();
    return (
        <SettingsTab>
            <Card variant="danger">
                <Forms.FormTitle tag="h5">{tr("loader.settings.themes.are.not.supported.on.the.userscript", "Themes are not supported on the Userscript!")}</Forms.FormTitle>

                <Forms.FormText>
                    <LocalizedText id="loader.settings.you.can.instead.install.themes.with.the.extension" fallback="You can instead install themes with the {extension}!" slots={{ extension: <Link href={getStylusWebStoreUrl()}>{tr("loader.settings.stylus.extension", "Stylus extension")}</Link> }} />
                </Forms.FormText>
            </Card>
        </SettingsTab>
    );
}

export default IS_USERSCRIPT
    ? wrapTab(UserscriptThemesTab, "Themes")
    : wrapTab(ThemesTab, "Themes");
