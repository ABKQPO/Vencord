/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { tr, useLocale } from "@utils/localization";
import { ConfirmModalProps, RenderModalProps } from "@vencord/discord-types";
import { ConfirmModal, openModal } from "@webpack/common";

import { relaunch } from "./native";

/**
 * @param type - "relaunch" to restart the entire application, "reload" to only reload Discord (CTRL + R)
 * @param props - Properties for the confirmation modal, uses sensible defaults
 */
export function promptToRestart(
    type: "relaunch" | "reload",
    props: Partial<ConfirmModalProps> = {}
) {
    const onConfirm = type === "relaunch"
        ? relaunch
        : () => location.reload();

    openModal(modalProps => <RestartModal {...modalProps} {...props} onConfirm={onConfirm} />);
}

function RestartModal(props: Partial<ConfirmModalProps> & RenderModalProps) {
    useLocale();
    return (
        <ConfirmModal
            variant="primary"
            {...props}

            title={props.title ?? tr("loader.5e0716dcc27f", "Restart Required")}
            subtitle={props.subtitle ?? tr("loader.0c2eb35a645e", "A restart is required to apply this change")}
            confirmText={props.confirmText ?? tr("loader.09af1002abaf", "Restart now")}
            cancelText={props.cancelText ?? tr("loader.ddaeaad65c51", "Later!")}
        />
    );
}
