/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Link } from "@components/Link";
import { settings } from "@plugins/decor/settings";
import { DecorationModalClasses, requireAvatarDecorationModal } from "@plugins/decor/ui";
import { tr, useLocale } from "@utils/localization";
import { RenderModalProps } from "@vencord/discord-types";
import { ConfirmModal, Forms, openModal } from "@webpack/common";

import { openCreateDecorationModal } from "./CreateDecorationModal";

function GuidelinesModal(props: RenderModalProps) {
    useLocale();
    return (
        <ConfirmModal
            {...props}
            title={tr("plugins.Decor.holdOn", "Hold on")}
            confirmText={tr("plugins.Decor.continue", "Continue")}
            variant="primary"
            onConfirm={() => {
                settings.store.agreedToGuidelines = true;
                props.onClose();
                openCreateDecorationModal();
            }}
        >
            <div className={DecorationModalClasses.modal}>
                <Forms.FormText>
                    {tr("plugins.Decor.bySubmittingADecorationYouAgreeTo", "By submitting a decoration, you agree to")} <Link
                        href="https://github.com/decor-discord/.github/blob/main/GUIDELINES.md"
                    >
                        {tr("plugins.Decor.theGuidelines", "the guidelines")}
                    </Link>{tr("plugins.Decor.notReadingTheseGuidelinesMayGetYourAccountSuspendedFromCreatingMoreDecorationsInTheFuture", ". Not reading these guidelines may get your account suspended from creating more decorations in the future.")}
                </Forms.FormText>
            </div>
        </ConfirmModal>
    );
}

export const openGuidelinesModal = () =>
    requireAvatarDecorationModal().then(() => openModal(props => <GuidelinesModal {...props} />));
