/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { SessionInfo } from "@plugins/betterSessions/types";
import { cl } from "@plugins/betterSessions/utils";
import { tr, useLocale } from "@utils/localization";
import { openModal } from "@webpack/common";

import { RenameModal } from "./RenameModal";

export function RenameButton({ session, state }: { session: SessionInfo["session"], state: [string, React.Dispatch<React.SetStateAction<string>>]; }) {
    useLocale();
    return (
        <Button
            variant="secondary"
            size="xs"
            className={cl("rename-btn")}
            onClick={() =>
                openModal(props => (
                    <RenameModal
                        props={props}
                        session={session}
                        state={state}
                    />
                ))
            }
        >
            {tr("plugins.BetterSessions.rename", "Rename")}
        </Button>
    );
}

export function NewButton() {
    useLocale();
    return (
        <Button
            variant="dangerPrimary"
            size="min"
            className={cl("new-btn")}
        >
            {tr("plugins.BetterSessions.nEW", "NEW")}
        </Button>
    );
}
