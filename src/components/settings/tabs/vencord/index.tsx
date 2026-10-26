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

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { Divider } from "@components/Divider";
import { FormSwitch } from "@components/FormSwitch";
import { FolderIcon, GithubIcon, LogIcon, PaintbrushIcon, RestartIcon } from "@components/Icons";
import { QuickAction, QuickActionCard } from "@components/settings/QuickAction";
import { SpecialCard } from "@components/settings/SpecialCard";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { LocalizedText } from "@components/settings/tabs/LocalizedText";
import { openContributorModal } from "@components/settings/tabs/plugins/ContributorModal";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import NoTrack from "@plugins/_core/noTrack";
import SettingsPlugin from "@plugins/_core/settings";
import { gitRemote } from "@shared/vencordUserAgent";
import { IS_WINDOWS } from "@utils/constants";
import { getLocale, tr, useLocale } from "@utils/localization";
import { Margins } from "@utils/margins";
import { isPluginDev } from "@utils/misc";
import { relaunch } from "@utils/native";
import { promptToRestart } from "@utils/promptToRestart";
import { Forms, React, useMemo, UserStore } from "@webpack/common";

import { DonateButtonComponent, isDonor } from "./DonateButton";
import { MacOSVibrancySettings } from "./MacVibrancySettings";
import { NotificationSection } from "./NotificationSettings";
import { WindowsMaterialSettings } from "./WindowsMaterialSettings";

const DEFAULT_DONATE_IMAGE = "https://cdn.discordapp.com/emojis/1026533090627174460.png";
const SHIGGY_DONATE_IMAGE = "https://media.discordapp.net/stickers/1039992459209490513.png";
const VENNIE_DONATOR_IMAGE = "https://cdn.discordapp.com/emojis/1238120638020063377.png";
const COZY_CONTRIB_IMAGE = "https://cdn.discordapp.com/emojis/1026533070955872337.png";
const DONOR_BACKGROUND_IMAGE = "https://media.discordapp.net/stickers/1311070116305436712.png?size=2048";
const CONTRIB_BACKGROUND_IMAGE = "https://media.discordapp.net/stickers/1311070166481895484.png?size=2048";

type KeysOfType<Object, Type> = {
    [K in keyof Object]: Object[K] extends Type ? K : never;
}[keyof Object];

function Switches() {
    useLocale();
    const settings = useSettings(["useQuickCss", "enableReactDevtools", "frameless", "nativeTitleBar", "transparent", "winCtrlQ", "disableMinSize"]);
    const { disableAnalytics } = NoTrack.settings.use(["disableAnalytics"]);

    const Switches = [
        {
            key: "useQuickCss",
            title: tr("loader.settings.enable.custom.css", "Enable Custom CSS"),
            description: tr("loader.settings.apply.your.configured.quickcss", "Apply your configured QuickCSS")
        },
        {
            value: disableAnalytics,
            updateSetting(newValue) {
                NoTrack.settings.store.disableAnalytics = newValue;
            },
            reactKey: "NoTrack::disableAnalytics",
            key: null!,
            title: tr("loader.settings.block.discord.analytics", "Block Discord Analytics"),
            description: tr("loader.settings.block.discord.s.tracking.analytics.disable.this.if.you.want.badges.to.track.your.progress.eg.ho", "Block Discord's tracking analytics. Disable this if you want badges to track your progress (eg: hours streamed)."),
            restartRequired: NoTrack.settings.def.disableAnalytics.restartNeeded,
        },
        IS_DISCORD_DESKTOP && {
            key: "nativeTitleBar",
            title: tr("loader.settings.enable.the.system.s.title.bar.in.addition.to.discord.s.custom.one", "Enable the system's title bar in addition to Discord's custom one"),
            restartRequired: true
        },
        !IS_WEB && {
            key: "transparent",
            title: tr("loader.settings.enable.window.transparency", "Enable window transparency"),
            description: tr("loader.settings.a.theme.that.supports.transparency.is.required.or.this.will.do.nothing.stops.the.window.from.be", "A theme that supports transparency is required or this will do nothing. Stops the window from being resizable as a side effect"),
            restartRequired: true
        },
        IS_DISCORD_DESKTOP && {
            key: "disableMinSize",
            title: tr("loader.settings.disable.minimum.window.size", "Disable minimum window size"),
            description: tr("loader.settings.allows.you.to.resize.the.window.to.any.size.even.smaller.than.discord.s.minimum.size", "Allows you to resize the window to any size, even smaller than Discord's minimum size"),
            restartRequired: true
        },
        !IS_WEB && IS_WINDOWS && {
            key: "winCtrlQ",
            title: tr("loader.settings.register.ctrl.q.as.shortcut.to.close.discord.alternative.to.alt.f4", "Register Ctrl+Q as shortcut to close Discord (Alternative to Alt+F4)"),
            restartRequired: true
        },
        !IS_WEB && {
            key: "enableReactDevtools",
            title: tr("loader.settings.enable.react.developer.tools", "Enable React Developer Tools"),
            description: tr("loader.settings.mainly.useful.for.plugin.developers.ignore.this.if.you.don.t.know.what.it.is", "Mainly useful for plugin developers. Ignore this if you don't know what it is"),
            restartRequired: true
        },
    ] satisfies Array<false | {
        key: KeysOfType<typeof settings, boolean>;
        reactKey?: string;
        title: string;
        description?: string;
        restartRequired?: boolean;
        updateSetting?(newValue: boolean): void;
        value?: boolean;
    }>;

    return Switches.map(setting => {
        if (!setting) {
            return null;
        }

        const { reactKey, key, value, title, description, restartRequired, updateSetting = v => (settings[key] = v) } = setting;

        return (
            <FormSwitch
                key={reactKey ?? key}
                title={title}
                description={description}
                value={value ?? settings[key]}
                hideBorder
                onChange={v => {
                    updateSetting(v);

                    if (restartRequired) {
                        promptToRestart("relaunch");
                    }
                }}
            />
        );
    });
}

function VencordSettings() {
    useLocale();
    const donateImage = useMemo(() =>
        Math.random() > 0.5 ? DEFAULT_DONATE_IMAGE : SHIGGY_DONATE_IMAGE,
        []
    );

    const user = UserStore?.getCurrentUser();

    return (
        <SettingsTab>
            {isDonor(user?.id)
                ? (
                    <SpecialCard
                        title={tr("loader.settings.donations", "Donations")}
                        subtitle={tr("loader.settings.thank.you.for.donating", "Thank you for donating!")}
                        description={tr("loader.settings.you.can.manage.your.perks.at.any.time.by.messaging.vending.machine", "You can manage your perks at any time by messaging @vending.machine.")}
                        cardImage={VENNIE_DONATOR_IMAGE}
                        backgroundImage={DONOR_BACKGROUND_IMAGE}
                        backgroundColor="#ED87A9"
                    >
                        <DonateButtonComponent />
                    </SpecialCard>
                )
                : (
                    <SpecialCard
                        title={tr("loader.settings.support.the.project", "Support the Project")}
                        description={tr("loader.settings.please.consider.supporting.the.development.of.vencord.by.donating", "Please consider supporting the development of Vencord by donating!")}
                        cardImage={donateImage}
                        backgroundImage={DONOR_BACKGROUND_IMAGE}
                        backgroundColor="#c3a3ce"
                    >
                        <DonateButtonComponent />
                    </SpecialCard>
                )
            }

            {isPluginDev(user?.id) && (
                <SpecialCard
                    title={tr("loader.settings.contributions", "Contributions")}
                    subtitle={tr("loader.settings.thank.you.for.contributing", "Thank you for contributing!")}
                    description={tr("loader.settings.since.you.ve.contributed.to.vencord.you.now.have.a.cool.new.badge", "Since you've contributed to Vencord you now have a cool new badge!")}
                    cardImage={COZY_CONTRIB_IMAGE}
                    backgroundImage={CONTRIB_BACKGROUND_IMAGE}
                    backgroundColor="#EDCC87"
                    buttonTitle={tr("loader.settings.see.what.you.ve.contributed.to", "See what you've contributed to")}
                    buttonOnClick={() => openContributorModal(user)}
                />
            )}

            <section>
                <Forms.FormTitle tag="h5">{tr("loader.settings.quick.actions", "Quick Actions")}</Forms.FormTitle>

                <QuickActionCard>
                    <QuickAction
                        Icon={LogIcon}
                        text={tr("loader.settings.notification.log", "Notification Log")}
                        action={openNotificationLogModal}
                    />
                    <QuickAction
                        Icon={PaintbrushIcon}
                        text={tr("loader.settings.edit.quickcss", "Edit QuickCSS")}
                        action={() => VencordNative.quickCss.openEditor(getLocale())}
                    />
                    {!IS_WEB && (
                        <>
                            <QuickAction
                                Icon={RestartIcon}
                                text={tr("loader.settings.relaunch.discord", "Relaunch Discord")}
                                action={relaunch}
                            />
                            <QuickAction
                                Icon={FolderIcon}
                                text={tr("loader.settings.open.settings.folder", "Open Settings Folder")}
                                action={() => VencordNative.settings.openFolder()}
                            />
                        </>
                    )}
                    <QuickAction
                        Icon={GithubIcon}
                        text={tr("loader.settings.view.source.code", "View Source Code")}
                        action={() => VencordNative.native.openExternal("https://github.com/" + gitRemote)}
                    />
                </QuickActionCard>
            </section>

            <Divider />

            <section className={Margins.top16}>
                <Forms.FormTitle tag="h5">{tr("loader.settings.settings", "Settings")}</Forms.FormTitle>
                <Forms.FormText className={Margins.bottom20} style={{ color: "var(--text-muted)" }}>
                    <LocalizedText id="loader.settings.hint.you.can.change.the.position.of.this.settings.section.in.the.settings" fallback="Hint: You can change the position of this settings section in the {settings}." slots={{ settings: <a onClick={() => openPluginModal(SettingsPlugin)}>{tr("loader.settings.settings.of.the.settings.plugin", "settings of the Settings plugin")}</a> }} />
                </Forms.FormText>

                <div className="vc-settings-switches">
                    <Switches />
                </div>
            </section>


            <MacOSVibrancySettings />
            <WindowsMaterialSettings />

            <NotificationSection />
        </SettingsTab>
    );
}

export default wrapTab(VencordSettings, "Vencord Settings");
