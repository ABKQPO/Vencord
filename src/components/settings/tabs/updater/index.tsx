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

import { useSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { HeadingSecondary } from "@components/Heading";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { LocalizedText } from "@components/settings/tabs/LocalizedText";
import { tr, useLocale } from "@utils/localization";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { useAwaiter } from "@utils/react";
import { getRepo, isNewer, UpdateLogger } from "@utils/updater";
import { Forms, React } from "@webpack/common";

import gitHash from "~git-hash";

import { CommonProps, HashLink, Newer, Updatable } from "./Components";

function VesktopSection() {
    useLocale();
    if (!IS_VESKTOP) return null;

    const [isVesktopOutdated] = useAwaiter<boolean>(VesktopNative.app.isOutdated, { fallbackValue: false });

    return (
        <Flex className={Margins.bottom20} flexDirection="column" gap="1em">
            <Card variant="info">
                <HeadingSecondary>{tr("loader.settings.vesktop.vencord", "Vesktop & Vencord")}</HeadingSecondary>
                <Paragraph>{tr("loader.settings.vesktop.and.vencord.are.two.separate.things.this.updater.is.for.vencord", "Vesktop and Vencord are two separate things. This updater is for Vencord.")}</Paragraph>
                <Paragraph className={Margins.top8}>
                    <LocalizedText id="loader.settings.you.receive.separate.popups.for.vesktop.updates.you.can.also.manually.update.by.installing.the." fallback="You receive separate popups for Vesktop updates. You can also manually update by installing the {version}." slots={{ version: <Link href="https://vesktop.dev/install">{tr("loader.settings.latest.version", "latest version")}</Link> }} />
                </Paragraph>
            </Card>

            {isVesktopOutdated && (
                <Card variant="warning">
                    <HeadingSecondary>{tr("loader.settings.vesktop.outdated", "Vesktop Outdated")}</HeadingSecondary>
                    <Flex flexDirection="column" gap="0.5em">
                        <Paragraph>{tr("loader.settings.your.version.of.vesktop.is.outdated", "Your version of Vesktop is outdated!")}</Paragraph>
                        <Button variant="link" onClick={() => VesktopNative.app.openUpdater()}>{tr("loader.settings.open.vesktop.updater", "Open Vesktop Updater")}</Button>
                    </Flex>
                </Card>
            )}
        </Flex>
    );
}

function Updater() {
    useLocale();
    const settings = useSettings(["autoUpdate", "autoUpdateNotification"]);

    const [repo, err, repoPending] = useAwaiter(getRepo, {
        fallbackValue: tr("loader.settings.loading", "Loading..."),
        onError: e => UpdateLogger.error("Failed to retrieve repo", err)
    });

    const commonProps: CommonProps = {
        repo,
        repoPending
    };

    return (
        <SettingsTab>
            <VesktopSection />

            <div className="vc-settings-switches">
                <FormSwitch
                    title={tr("loader.settings.automatically.update", "Automatically update")}
                    description={tr("loader.settings.automatically.update.vencord.without.confirmation.prompt", "Automatically update Vencord without confirmation prompt")}
                    value={settings.autoUpdate}
                    onChange={(v: boolean) => settings.autoUpdate = v}
                    hideBorder
                />
                <FormSwitch
                    title={tr("loader.settings.get.notified.when.an.automatic.update.completes", "Get notified when an automatic update completes")}
                    description={tr("loader.settings.show.a.notification.when.vencord.automatically.updates", "Show a notification when Vencord automatically updates")}
                    value={settings.autoUpdateNotification}
                    onChange={(v: boolean) => settings.autoUpdateNotification = v}
                    disabled={!settings.autoUpdate}
                    hideBorder
                />
            </div>

            <Forms.FormTitle tag="h5" className={Margins.top20}>{tr("loader.settings.repo", "Repo")}</Forms.FormTitle>

            <Forms.FormText>
                {repoPending
                    ? tr("loader.settings.loading", "Loading...")
                    : err
                        ? tr("loader.settings.failed.to.retrieve.check.console", "Failed to retrieve - check console")
                        : (
                            <Link href={repo}>
                                {repo.split("/").slice(-2).join("/")}
                            </Link>
                        )
                }
                {" "}
                (<HashLink hash={gitHash} repo={repo} disabled={repoPending} />)
            </Forms.FormText>

            <Divider className={classes(Margins.top16, Margins.bottom16)} />

            <Forms.FormTitle tag="h5">{tr("loader.settings.updates", "Updates")}</Forms.FormTitle>

            {isNewer
                ? <Newer {...commonProps} />
                : <Updatable {...commonProps} />
            }
        </SettingsTab>
    );
}

export default IS_UPDATER_DISABLED
    ? null
    : wrapTab(Updater, "Updater");
