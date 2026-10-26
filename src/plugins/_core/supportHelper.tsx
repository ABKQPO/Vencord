/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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

import { isPluginEnabled } from "@api/PluginManager";
import { definePluginSettings } from "@api/Settings";
import { getUserSettingLazy } from "@api/UserSettings";
import { Card } from "@components/Card";
import ErrorBoundary from "@components/ErrorBoundary";
import { Flex } from "@components/Flex";
import { Link } from "@components/Link";
import { openSettingsTabModal, UpdaterTab } from "@components/settings";
import { LocalizedText } from "@components/settings/tabs/LocalizedText";
import { CONTRIB_ROLE_ID, Devs, DONOR_ROLE_ID, KNOWN_ISSUES_CHANNEL_ID, REGULAR_ROLE_ID, SUPPORT_CATEGORY_ID, SUPPORT_CHANNEL_ID, VENBOT_USER_ID, VENCORD_GUILD_ID } from "@utils/constants";
import { sendMessage } from "@utils/discord";
import { tr, useLocale } from "@utils/localization";
import { Logger } from "@utils/Logger";
import { Margins } from "@utils/margins";
import { isPluginDev, tryOrElse } from "@utils/misc";
import { relaunch } from "@utils/native";
import { onlyOnce } from "@utils/onlyOnce";
import { makeCodeblock } from "@utils/text";
import definePlugin from "@utils/types";
import { checkForUpdates, isOutdated, update } from "@utils/updater";
import { Channel, RenderModalProps } from "@vencord/discord-types";
import { Button, ChannelStore, ConfirmModal, Forms, GuildMemberStore, openModal, Parser, PermissionsBits, PermissionStore, RelationshipStore, showToast, Text, UserStore } from "@webpack/common";
import { JSX } from "react";

import gitHash from "~git-hash";
import plugins, { PluginMeta } from "~plugins";

import SettingsPlugin from "./settings";

const AdditionalAllowedChannelIds = [
    "1024286218801926184", // Vencord > #bot-commands
];

const TrustedRolesIds = [
    CONTRIB_ROLE_ID, // contributor
    REGULAR_ROLE_ID, // regular
    DONOR_ROLE_ID, // donor
];

const ShowCurrentGame = getUserSettingLazy<boolean>("status", "showCurrentGame")!;

const isSupportAllowedChannel = (channel: Channel) => channel.parent_id === SUPPORT_CATEGORY_ID || AdditionalAllowedChannelIds.includes(channel.id);

async function forceUpdate() {
    const outdated = await checkForUpdates();
    if (outdated) {
        await update();
        relaunch();
    }

    return outdated;
}

async function generateDebugInfoMessage() {
    const { RELEASE_CHANNEL } = window.GLOBAL_ENV;

    const client = (() => {
        if (IS_DISCORD_DESKTOP) return `Discord Desktop v${DiscordNative.app.getVersion()}`;
        if (IS_VESKTOP) return `Vesktop v${VesktopNative.app.getVersion()}`;
        if ("legcord" in window) return `Legcord v${window.legcord.version}`;

        // @ts-expect-error
        const name = typeof unsafeWindow !== "undefined" ? "UserScript" : "Web";
        return `${name} (${navigator.userAgent})`;
    })();

    const info = {
        Vencord:
            `v${VERSION} • [${gitHash}](<https://github.com/Vendicated/Vencord/commit/${gitHash}>)` +
            `${SettingsPlugin.additionalInfo} - ${Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(BUILD_TIMESTAMP)}`,
        Client: `${RELEASE_CHANNEL} ~ ${client}`,
        Platform: navigator.platform
    };

    if (IS_DISCORD_DESKTOP) {
        info["Last Crash Reason"] = (await tryOrElse(() => DiscordNative.processUtils.getLastCrash(), undefined))?.rendererCrashReason ?? "N/A";
    }

    const commonIssues = {
        "Activity Sharing disabled": tryOrElse(() => !ShowCurrentGame.getSetting(), false),
        "Vencord DevBuild": !IS_STANDALONE,
        "Has UserPlugins": Object.values(PluginMeta).some(m => m.userPlugin),
        "More than two weeks out of date": BUILD_TIMESTAMP < Date.now() - 12096e5,
    };

    let content = `>>> ${Object.entries(info).map(([k, v]) => `**${k}**: ${v}`).join("\n")}`;
    content += "\n" + Object.entries(commonIssues)
        .filter(([, v]) => v).map(([k]) => `⚠️ ${k}`)
        .join("\n");

    return content.trim();
}

function generatePluginList() {
    const isApiPlugin = (plugin: string) => plugin.endsWith("API") || plugins[plugin].required;

    const enabledPlugins = Object.keys(plugins)
        .filter(p => isPluginEnabled(p) && !isApiPlugin(p));

    const enabledStockPlugins = enabledPlugins.filter(p => !PluginMeta[p].userPlugin);
    const enabledUserPlugins = enabledPlugins.filter(p => PluginMeta[p].userPlugin);


    let content = `**Enabled Plugins (${enabledStockPlugins.length}):**\n${makeCodeblock(enabledStockPlugins.join(", "))}`;

    if (enabledUserPlugins.length) {
        content += `**Enabled UserPlugins (${enabledUserPlugins.length}):**\n${makeCodeblock(enabledUserPlugins.join(", "))}`;
    }

    return content;
}

const checkForUpdatesOnce = onlyOnce(checkForUpdates);

const settings = definePluginSettings({}).withPrivateSettings<{
    dismissedDevBuildWarning?: boolean;
}>();

function DevBuildConfirmModal(props: RenderModalProps) {
    useLocale();
    const s = settings.use(["dismissedDevBuildWarning"]);

    return (
        <ConfirmModal
            {...props}
            title={tr("loader.be5b6042d3f0", "Hold on!")}
            confirmText={tr("loader.501721f0699e", "Understood")}
            variant="primary"
            checkboxProps={{
                checked: s.dismissedDevBuildWarning === true,
                onChange: checked => s.dismissedDevBuildWarning = checked
            }}
        >
            <div>
                <Forms.FormText>{tr("loader.ddf3ca688344", "You are using a custom build of Vencord, which we do not provide support for!")}</Forms.FormText>

                <Forms.FormText className={Margins.top8}>
                    <LocalizedText id="support.officialOnly" fallback="We only provide support for {official}. Either {switchBuild} or figure your issue out yourself." slots={{
                        official: <Link href="https://vencord.dev/download">{tr("loader.381ab9ef8595", "official builds")}</Link>,
                        switchBuild: <Link href="https://vencord.dev/download">{tr("loader.0c77105f45f4", "switch to an official build")}</Link>
                    }} />
                </Forms.FormText>

                <Text variant="text-md/bold" className={Margins.top8}>{tr("loader.1ea7a8ae4584", "You will be banned from receiving support if you ignore this rule.")}</Text>
            </div>
        </ConfirmModal>
    );
}

export default definePlugin({
    name: "SupportHelper",
    required: true,
    description: "Helps us provide support to you",
    authors: [Devs.Ven],
    dependencies: ["UserSettingsAPI"],

    settings,

    patches: [{
        find: "#{intl::BEGINNING_DM}",
        replacement: {
            match: /#{intl::BEGINNING_DM},{.+?}\),(?=.{0,300}(\i)\.isMultiUserDM)/,
            replace: "$& $self.renderContributorDmWarningCard({ channel: $1 }),"
        }
    }],

    commands: [
        {
            name: "vencord-debug",
            description: "Send Vencord debug info",
            predicate: ctx => isPluginDev(UserStore.getCurrentUser()?.id) || isSupportAllowedChannel(ctx.channel),
            execute: async () => ({ content: await generateDebugInfoMessage() })
        },
        {
            name: "vencord-plugins",
            description: "Send Vencord plugin list",
            predicate: ctx => isPluginDev(UserStore.getCurrentUser()?.id) || isSupportAllowedChannel(ctx.channel),
            execute: () => ({ content: generatePluginList() })
        }
    ],

    flux: {
        async CHANNEL_SELECT({ channelId }) {
            const isSupportChannel = channelId === SUPPORT_CHANNEL_ID || ChannelStore.getChannel(channelId)?.parent_id === SUPPORT_CATEGORY_ID;
            if (!isSupportChannel) return;

            const selfId = UserStore.getCurrentUser()?.id;
            if (!selfId || isPluginDev(selfId)) return;

            if (!IS_UPDATER_DISABLED) {
                await checkForUpdatesOnce().catch(() => { });

                if (isOutdated) {
                    openModal(props => (
                        <ConfirmModal
                            {...props}
                            variant="primary"
                            title={tr("loader.be5b6042d3f0", "Hold on!")}
                            confirmText={tr("loader.11cb6942675b", "Update & Restart Now")}
                            cancelText={tr("loader.384719ba9151", "View Updates")}
                            onConfirm={forceUpdate}
                            onCancel={() => openSettingsTabModal(UpdaterTab!)}
                        >
                            <div>
                                <Forms.FormText>{tr("loader.cd2a4b4fc7ce", "You are using an outdated version of Vencord! Chances are, your issue is already fixed.")}</Forms.FormText>
                                <Forms.FormText className={Margins.top8}>
                                    {tr("loader.10ca2540a43e", "Please first update before asking for support!")}
                                </Forms.FormText>
                                <Forms.FormText className={Margins.top8}>
                                    {tr("loader.9ee4513ae11c", "If you know what you're doing or cannot update, you can dismiss this prompt.")}
                                </Forms.FormText>
                            </div>
                        </ConfirmModal>
                    ));
                    return;
                }
            }

            const roles = GuildMemberStore.getSelfMember(VENCORD_GUILD_ID)?.roles;
            if (!roles || TrustedRolesIds.some(id => roles.includes(id))) return;

            if (!IS_WEB && IS_UPDATER_DISABLED) {
                openModal(props => (
                    <ConfirmModal
                        {...props}
                        title={tr("loader.be5b6042d3f0", "Hold on!")}
                        confirmText={tr("loader.565339bc4d33", "OK")}
                        variant="primary"
                    >
                        <div>
                            <Forms.FormText>{tr("loader.3239f605e8da", "You are using an externally updated Vencord version, which we do not provide support for!")}</Forms.FormText>
                            <Forms.FormText className={Margins.top8}>
                                <LocalizedText id="support.externalBuild" fallback="Please either switch to an {official}, or contact your package maintainer for support instead." slots={{
                                    official: <Link href="https://vencord.dev/download">{tr("loader.82757e332b1b", "officially supported version of Vencord")}</Link>
                                }} />
                            </Forms.FormText>
                        </div>
                    </ConfirmModal>
                ));
                return;
            }

            if (!IS_STANDALONE && !settings.store.dismissedDevBuildWarning) {
                openModal(props => <DevBuildConfirmModal {...props} />);
                return;
            }
        }
    },

    renderMessageAccessory(props) {
        if (props.message.vencordEmbeddedBy) return null;

        const buttons = [] as JSX.Element[];

        const shouldAddUpdateButton =
            !IS_UPDATER_DISABLED
            && (
                (props.channel.id === KNOWN_ISSUES_CHANNEL_ID) ||
                (props.channel.parent_id === SUPPORT_CATEGORY_ID && props.message.author.id === VENBOT_USER_ID)
            )
            && props.message.content?.toLowerCase().includes("update");

        if (shouldAddUpdateButton) {
            buttons.push(
                <Button
                    key="vc-update"
                    color={Button.Colors.GREEN}
                    onClick={async () => {
                        try {
                            if (await forceUpdate())
                                showToast({ text: tr("loader.2f8e8ba757f5", "Success! Restarting..."), variant: "success" });
                            else
                                showToast({ text: tr("loader.05ce07e5106d", "Already up to date!") });
                        } catch (e) {
                            new Logger(this.name).error("Error while updating:", e);
                            showToast({ text: tr("loader.ae53a99550ad", "Failed to update :("), variant: "critical" });
                        }
                    }}
                >
                    {tr("loader.f96f4d46e788", "Update Now")}
                </Button>
            );
        }

        if (props.channel.parent_id === SUPPORT_CATEGORY_ID && PermissionStore.can(PermissionsBits.SEND_MESSAGES, props.channel)) {
            if (props.message.content.includes("/vencord-debug") || props.message.content.includes("/vencord-plugins")) {
                buttons.push(
                    <Button
                        key="vc-dbg"
                        color={Button.Colors.PRIMARY}
                        onClick={async () => sendMessage(props.channel.id, { content: await generateDebugInfoMessage() })}
                    >
                        {tr("loader.7e3907a8e2ef", "Run /vencord-debug")}
                    </Button>,
                    <Button
                        key="vc-plg-list"
                        color={Button.Colors.PRIMARY}
                        onClick={async () => sendMessage(props.channel.id, { content: generatePluginList() })}
                    >
                        {tr("loader.7f38ea58a46a", "Run /vencord-plugins")}
                    </Button>
                );
            }
        }

        return buttons.length
            ? <Flex>{buttons}</Flex>
            : null;
    },

    renderContributorDmWarningCard: ErrorBoundary.wrap(({ channel }) => {
        useLocale();
        const userId = channel.getRecipientId();
        if (!isPluginDev(userId)) return null;
        if (RelationshipStore.isFriend(userId) || isPluginDev(UserStore.getCurrentUser()?.id)) return null;

        return (
            <Card variant="warning" className={Margins.top8} defaultPadding>
                {tr("loader.b95796d69d8b", "Please do not private message Vencord plugin developers for support!")}
                <br />
                {tr("loader.d92e9f4b000d", "Instead, use the Vencord support channel:")} {Parser.parse("https://discord.com/channels/1015060230222131221/1026515880080842772")}
                {!ChannelStore.getChannel(SUPPORT_CHANNEL_ID) && tr("support.clickToJoin", " (Click the link to join)")}
            </Card>
        );
    }, { noop: true }),
});
