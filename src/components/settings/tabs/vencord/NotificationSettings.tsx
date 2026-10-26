/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { ErrorCard } from "@components/ErrorCard";
import { Flex } from "@components/Flex";
import { LocalizedText } from "@components/settings/tabs/LocalizedText";
import { tr, useLocale } from "@utils/localization";
import { Margins } from "@utils/margins";
import { identity } from "@utils/misc";
import { Button, Forms, Modal,openModal, Select, Slider } from "@webpack/common";

export function NotificationSection() {
    useLocale();
    return (
        <section className={Margins.top16}>
            <Forms.FormTitle tag="h5">{tr("loader.settings.notifications", "Notifications")}</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom8}>
                {tr("loader.settings.settings.for.notifications.sent.by.vencord.this.does.not.include.discord.notifications.messages", "Settings for Notifications sent by Vencord. This does NOT include Discord notifications (messages, etc)")}</Forms.FormText>
            <Flex>
                <Button onClick={openNotificationSettingsModal}>
                    {tr("loader.settings.notification.settings", "Notification Settings")}</Button>
                <Button onClick={openNotificationLogModal}>
                    {tr("loader.settings.view.notification.log", "View Notification Log")}</Button>
            </Flex>
        </section>
    );
}

export function openNotificationSettingsModal() {
    openModal(function LocalizedModal(props) {
                useLocale();
                return (<Modal
            {...props}
            size="lg"
            title={tr("loader.settings.notification.settings", "Notification Settings")}
        >
            <NotificationSettings />
        </Modal>);
            });
}

function NotificationSettings() {
    useLocale();
    const settings = useSettings(["notifications.*"]).notifications;

    return (
        <>
            <Forms.FormTitle tag="h5">{tr("loader.settings.notification.style", "Notification Style")}</Forms.FormTitle>
            {settings.useNative !== "never" && Notification?.permission === "denied" && (
                <ErrorCard style={{ padding: "1em" }} className={Margins.bottom8}>
                    <Forms.FormTitle tag="h5">{tr("loader.settings.desktop.notification.permission.denied", "Desktop Notification Permission denied")}</Forms.FormTitle>
                    <Forms.FormText>{tr("loader.settings.you.have.denied.notification.permissions.thus.desktop.notifications.will.not.work", "You have denied Notification Permissions. Thus, Desktop notifications will not work!")}</Forms.FormText>
                </ErrorCard>
            )}
            <Forms.FormText className={Margins.bottom8}>
                {tr("loader.settings.some.plugins.may.show.you.notifications.these.come.in.two.styles", "Some plugins may show you notifications. These come in two styles:")}<ul>
                    <li><LocalizedText id="loader.settings.name.these.are.in.app.notifications" fallback="{name}: These are in-app notifications" slots={{ name: <strong>{tr("loader.settings.vencord.notifications", "Vencord Notifications")}</strong> }} /></li>
                    <li><LocalizedText id="loader.settings.name.native.desktop.notifications.like.when.you.get.a.ping" fallback="{name}: Native Desktop notifications (like when you get a ping)" slots={{ name: <strong>{tr("loader.settings.desktop.notifications", "Desktop Notifications")}</strong> }} /></li>
                </ul>
            </Forms.FormText>
            <Select
                placeholder={tr("loader.settings.notification.style", "Notification Style")}
                options={[
                    { label: tr("loader.settings.only.use.desktop.notifications.when.discord.is.not.focused", "Only use Desktop notifications when Discord is not focused"), value: "not-focused", default: true },
                    { label: tr("loader.settings.always.use.desktop.notifications", "Always use Desktop notifications"), value: "always" },
                    { label: tr("loader.settings.always.use.vencord.notifications", "Always use Vencord notifications"), value: "never" },
                ] satisfies Array<{ value: typeof settings["useNative"]; } & Record<string, any>>}
                closeOnSelect={true}
                select={v => settings.useNative = v}
                isSelected={v => v === settings.useNative}
                serialize={identity}
            />

            <Forms.FormTitle tag="h5" className={Margins.top16 + " " + Margins.bottom8}>{tr("loader.settings.notification.position", "Notification Position")}</Forms.FormTitle>
            <Select
                isDisabled={settings.useNative === "always"}
                placeholder={tr("loader.settings.notification.position", "Notification Position")}
                options={[
                    { label: tr("loader.settings.bottom.right", "Bottom Right"), value: "bottom-right", default: true },
                    { label: tr("loader.settings.top.right", "Top Right"), value: "top-right" },
                ] satisfies Array<{ value: typeof settings["position"]; } & Record<string, any>>}
                select={v => settings.position = v}
                isSelected={v => v === settings.position}
                serialize={identity}
            />

            <Forms.FormTitle tag="h5" className={Margins.top16 + " " + Margins.bottom8}>{tr("loader.settings.notification.timeout", "Notification Timeout")}</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom16}>{tr("loader.settings.set.to.0s.to.never.automatically.time.out", "Set to 0s to never automatically time out")}</Forms.FormText>
            <Slider
                disabled={settings.useNative === "always"}
                markers={[0, 1000, 2500, 5000, 10_000, 20_000]}
                minValue={0}
                maxValue={20_000}
                initialValue={settings.timeout}
                onValueChange={v => settings.timeout = v}
                onValueRender={v => tr("loader.settings.durationSeconds", "{seconds}s", { seconds: (v / 1000).toFixed(2) })}
                onMarkerRender={v => tr("loader.settings.durationSeconds", "{seconds}s", { seconds: v / 1000 })}
                stickToMarkers={false}
            />

            <Forms.FormTitle tag="h5" className={Margins.top16 + " " + Margins.bottom8}>{tr("loader.settings.notification.log.limit", "Notification Log Limit")}</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom16}>
                <LocalizedText id="loader.settings.the.amount.of.notifications.to.save.in.the.log.until.old.ones.are.removed.set.to.zero.to.disabl" fallback="The amount of notifications to save in the log until old ones are removed. Set to {zero} to disable Notification log and {infinity} to never automatically remove old Notifications" slots={{ zero: <code>0</code>, infinity: <code>∞</code> }} />
            </Forms.FormText>
            <Slider
                markers={[0, 25, 50, 75, 100, 200]}
                minValue={0}
                maxValue={200}
                stickToMarkers={true}
                initialValue={settings.logLimit}
                onValueChange={v => settings.logLimit = v}
                onValueRender={v => v === 200 ? "∞" : v}
                onMarkerRender={v => v === 200 ? "∞" : v}
            />
        </>
    );
}
