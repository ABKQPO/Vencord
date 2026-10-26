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

import ErrorBoundary from "@components/ErrorBoundary";
import { handleComponentFailed } from "@components/handleComponentFailed";
import { tr, useLocale } from "@utils/localization";
import { onlyOnce } from "@utils/onlyOnce";
import { Modal, openModal } from "@webpack/common";
import type { ComponentType, PropsWithChildren } from "react";

export function SettingsTab({ children }: PropsWithChildren) {
    return (
        <section className="vc-settings-tab">{children}</section>
    );
}

export const handleSettingsTabError = onlyOnce(handleComponentFailed);

export function wrapTab(component: ComponentType<any>, tab: string) {
    const wrapped = ErrorBoundary.wrap(component, {
        displayName: `${tab}SettingsTab`,
        message: () => {
            return tr("loader.tab.failed", "Failed to render the {tab} tab. If this issue persists, try using the installer to reinstall!", { tab: getTabTitle(tab) });
        },
        onError: handleSettingsTabError,
    });

    return wrapped;
}

export function openSettingsTabModal(Tab: ComponentType<any>) {
    try {
        openModal(props => <SettingsTabModal {...props} Tab={Tab} />);
    } catch {
        handleSettingsTabError();
    }
}

function getTabTitle(tab: string) {
    const name = tab.replace(/SettingsTab$/, "");
    switch (name) {
        case "Vencord": case "Vencord Settings": return tr("loader.tab.vencord", "Vencord Settings");
        case "Plugins": return tr("loader.tab.plugins", "Plugins");
        case "Themes": return tr("loader.tab.themes", "Themes");
        case "Updater": return tr("loader.tab.updater", "Updater");
        case "Cloud": return tr("loader.tab.cloud", "Cloud");
        case "Backup & Restore": case "BackupAndRestore": return tr("loader.tab.backup", "Backup & Restore");
        case "Patch Helper": case "PatchHelper": return tr("loader.tab.patch", "Patch Helper");
        default: return name || tr("loader.tab.settings", "Settings");
    }
}

function SettingsTabModal({ Tab, ...props }: import("@vencord/discord-types").RenderModalProps & { Tab: ComponentType<any>; }) {
    useLocale();
    return (
        <Modal {...props} size="lg" title={getTabTitle(Tab.displayName ?? "")}>
            <Tab />
        </Modal>
    );
}
