/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ErrorCard } from "@components/ErrorCard";
import { tr, useLocale } from "@utils/localization";
import { UpdateLogger } from "@utils/updater";
import { ConfirmModal,openModal, Parser } from "@webpack/common";

function getErrorMessage(e: any) {
    if (!e?.code || !e.cmd)
        return tr("loader.settings.updater.unknownError", "An unknown error occurred.\nPlease try again or see the console for more info.");

    const { code, path, cmd, stderr } = e;

    if (code === "ENOENT")
        return tr("loader.settings.updater.error.command", "Command `{command}` not found.\nPlease install it and try again.", { command: path });

    const extra = stderr || tr("loader.settings.updater.error.code", "Code `{code}`. See the console for more info.", { code: code });

    return tr("loader.settings.updater.error.cmd.extra", "An error occurred while running `{cmd}`:\n{extra}", { cmd: cmd, extra: extra });
}

export function runWithDispatch(dispatch: React.Dispatch<React.SetStateAction<boolean>>, action: () => any) {
    return async () => {
        dispatch(true);

        try {
            await action();
        } catch (e: any) {
            UpdateLogger.error(e);



            openModal(function LocalizedModal(props) {
                useLocale();
                const err = getErrorMessage(e);
                return (<ConfirmModal
                    {...props}
                    title={tr("loader.settings.oops", "Oops!")}
                    confirmText={tr("loader.settings.ok", "OK")}
                    variant="primary"
                >
                    <ErrorCard>
                        {err.split("\n").map((line, idx) =>
                            <div key={idx}>{Parser.parse(line)}</div>
                        )}
                    </ErrorCard>
                </ConfirmModal>);
            });
        } finally {
            dispatch(false);
        }
    };
}
