/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { PlainSettings, Settings } from "@api/Settings";
import { tr } from "@utils/localization";
import { localStorage } from "@utils/localStorage";
import { Logger } from "@utils/Logger";
import { relaunch } from "@utils/native";
import { deflateSync, inflateSync } from "fflate";

import { checkCloudUrlCsp, deauthorizeCloud, getCloudAuth, getCloudUrl } from "./cloudSetup";
import { exportSettings, importSettings } from "./offline";

const logger = new Logger("SettingsSync:Cloud", "#39b7e0");

const SYNC_DIRECTION_KEY = "Vencord_cloudSyncDirection";
const SETTINGS_DIRTY_KEY = "Vencord_settingsDirty";
export const getCloudSyncDirection = () => localStorage.getItem(SYNC_DIRECTION_KEY) || "both";
export const setCloudSyncDirection = (direction: "push" | "pull" | "both" | "manual") => localStorage.setItem(SYNC_DIRECTION_KEY, direction);
export const areLocalSettingsDirty = () => localStorage.getItem(SETTINGS_DIRTY_KEY) === "true";
export const markLocalSettingsDirty = () => localStorage.setItem(SETTINGS_DIRTY_KEY, "true");
export const markLocalSettingsClean = () => localStorage.removeItem(SETTINGS_DIRTY_KEY);

export function shouldCloudSync(direction: "push" | "pull") {
    const localDirection = getCloudSyncDirection();

    return localDirection === direction || localDirection === "both";
}

export async function putCloudSettings(manual?: boolean) {
    const settings = await exportSettings({ minify: true });

    if (!await checkCloudUrlCsp()) return;

    try {
        const res = await fetch(new URL("/v1/settings", getCloudUrl()), {
            method: "PUT",
            headers: {
                Authorization: await getCloudAuth(),
                "Content-Type": "application/octet-stream"
            },
            body: deflateSync(new TextEncoder().encode(settings)) as Uint8Array<ArrayBuffer>
        });

        if (!res.ok) {
            logger.error(`Failed to sync up, API returned ${res.status}`);
            showNotification({
                title: tr("loader.runtime.0b35e178d912", "Cloud Settings"),
                body: tr("loader.runtime.c513f5769564", "Could not synchronize settings to cloud (API returned {value0}).", { value0: res.status }),
                color: "var(--red-360)"
            });
            return;
        }

        const { written } = await res.json();
        PlainSettings.cloud.settingsSyncVersion = written;
        VencordNative.settings.set(PlainSettings);

        logger.info("Settings uploaded to cloud successfully");

        if (manual) {
            showNotification({
                title: tr("loader.runtime.0b35e178d912", "Cloud Settings"),
                body: tr("loader.runtime.3042dcbbdb50", "Synchronized settings to the cloud!"),
                noPersist: true,
            });
        }

        markLocalSettingsClean();
    } catch (e: any) {
        logger.error("Failed to sync up", e);
        showNotification({
            title: tr("loader.runtime.0b35e178d912", "Cloud Settings"),
            body: tr("loader.runtime.97f51bf6d4da", "Could not synchronize settings to the cloud ({value0}).", { value0: e.toString() }),
            color: "var(--red-360)"
        });
    }
}

export async function getCloudSettings(shouldNotify = true, force = false) {
    if (!await checkCloudUrlCsp()) return;

    try {
        const res = await fetch(new URL("/v1/settings", getCloudUrl()), {
            method: "GET",
            headers: {
                Authorization: await getCloudAuth(),
                Accept: "application/octet-stream",
                "If-None-Match": Settings.cloud.settingsSyncVersion.toString()
            },
        });

        if (res.status === 404) {
            logger.info("No settings on the cloud");
            if (shouldNotify)
                showNotification({
                    title: tr("loader.runtime.0b35e178d912", "Cloud Settings"),
                    body: tr("loader.runtime.36b4fde9ec3b", "There are no settings in the cloud."),
                    noPersist: true
                });
            return false;
        }

        if (res.status === 304) {
            logger.info("Settings up to date");
            if (shouldNotify)
                showNotification({
                    title: tr("loader.runtime.0b35e178d912", "Cloud Settings"),
                    body: tr("loader.runtime.b6f339789f2a", "Your settings are up to date."),
                    noPersist: true
                });
            return false;
        }

        if (!res.ok) {
            logger.error(`Failed to sync down, API returned ${res.status}`);
            showNotification({
                title: tr("loader.runtime.0b35e178d912", "Cloud Settings"),
                body: tr("loader.runtime.db56e2af5633", "Could not synchronize settings from the cloud (API returned {value0}).", { value0: res.status }),
                color: "var(--red-360)"
            });
            return false;
        }

        const written = Number(res.headers.get("etag")!);
        const localWritten = Settings.cloud.settingsSyncVersion;

        // don't need to check for written > localWritten because the server will return 304 due to if-none-match
        if (!force && written < localWritten) {
            if (shouldNotify)
                showNotification({
                    title: tr("loader.runtime.0b35e178d912", "Cloud Settings"),
                    body: tr("loader.runtime.c5bcba1aaa84", "Your local settings are newer than the cloud ones."),
                    noPersist: true,
                });
            return;
        }

        const data = await res.arrayBuffer();

        const settings = new TextDecoder().decode(inflateSync(new Uint8Array(data)));
        await importSettings(settings);

        // sync with server timestamp instead of local one
        PlainSettings.cloud.settingsSyncVersion = written;
        VencordNative.settings.set(PlainSettings);

        logger.info("Settings loaded from cloud successfully");
        if (shouldNotify)
            showNotification({
                title: tr("loader.runtime.0b35e178d912", "Cloud Settings"),
                body: tr("loader.runtime.d428ba62bec5", "Your settings have been updated! Click here to restart to fully apply changes!"),
                color: "var(--green-360)",
                onClick: IS_WEB ? () => location.reload() : relaunch,
                noPersist: true
            });

        markLocalSettingsClean();

        return true;
    } catch (e: any) {
        logger.error("Failed to sync down", e);
        showNotification({
            title: tr("loader.runtime.0b35e178d912", "Cloud Settings"),
            body: tr("loader.runtime.1a43cc29918a", "Could not synchronize settings from the cloud ({value0}).", { value0: e.toString() }),
            color: "var(--red-360)"
        });

        return false;
    }
}

export async function deleteCloudSettings() {
    if (!await checkCloudUrlCsp()) return;

    try {
        const res = await fetch(new URL("/v1/settings", getCloudUrl()), {
            method: "DELETE",
            headers: { Authorization: await getCloudAuth() },
        });

        if (!res.ok) {
            logger.error(`Failed to delete, API returned ${res.status}`);
            showNotification({
                title: tr("loader.runtime.0b35e178d912", "Cloud Settings"),
                body: tr("loader.runtime.0db5ba64b7b5", "Could not delete settings (API returned {value0}).", { value0: res.status }),
                color: "var(--red-360)"
            });
            return;
        }

        logger.info("Settings deleted from cloud successfully");
        showNotification({
            title: tr("loader.runtime.0b35e178d912", "Cloud Settings"),
            body: tr("loader.runtime.7dd52e9ce6b3", "Settings deleted from cloud!"),
            color: "var(--green-360)"
        });
    } catch (e: any) {
        logger.error("Failed to delete", e);
        showNotification({
            title: tr("loader.runtime.0b35e178d912", "Cloud Settings"),
            body: tr("loader.runtime.8f7cd4117fe7", "Could not delete settings ({value0}).", { value0: e.toString() }),
            color: "var(--red-360)"
        });
    }
}

export async function eraseAllCloudData() {
    if (!await checkCloudUrlCsp()) return;

    const res = await fetch(new URL("/v1/", getCloudUrl()), {
        method: "DELETE",
        headers: { Authorization: await getCloudAuth() }
    });

    if (!res.ok) {
        logger.error(`Failed to erase data, API returned ${res.status}`);
        showNotification({
            title: tr("loader.runtime.1cfae478bac5", "Cloud Integrations"),
            body: tr("loader.runtime.031d6cf57c9f", "Could not erase all data (API returned {value0}), please contact support.", { value0: res.status }),
            color: "var(--red-360)"
        });
        return;
    }

    Settings.cloud.authenticated = false;
    await deauthorizeCloud();

    showNotification({
        title: tr("loader.runtime.1cfae478bac5", "Cloud Integrations"),
        body: tr("loader.runtime.e19617f5d6e5", "Successfully erased all data."),
        color: "var(--green-360)"
    });
}
