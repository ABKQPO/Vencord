/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Flex } from "@components/Flex";
import { DeleteIcon } from "@components/Icons";
import { Link } from "@components/Link";
import { AddonCard } from "@components/settings/AddonCard";
import { UserThemeHeader } from "@main/themes";
import { openInviteModal } from "@utils/discord";
import { tr, useLocale } from "@utils/localization";
import { showToast } from "@webpack/common";

interface ThemeCardProps {
    theme: UserThemeHeader;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    onDelete: () => void;
}

export function ThemeCard({ theme, enabled, onChange, onDelete }: ThemeCardProps) {
    useLocale();
    return (
        <AddonCard
            name={theme.name}
            description={theme.description}
            author={theme.author}
            enabled={enabled}
            setEnabled={onChange}
            infoButton={
                IS_WEB && (
                    <div style={{ cursor: "pointer", color: "var(--status-danger" }} onClick={onDelete}>
                        <DeleteIcon />
                    </div>
                )
            }
            footer={
                <Flex flexDirection="row" gap="0.2em">
                    {!!theme.website && <Link href={theme.website}>{tr("loader.settings.website", "Website")}</Link>}
                    {!!(theme.website && theme.invite) && " • "}
                    {!!theme.invite && (
                        <Link
                            href={`https://discord.gg/${theme.invite}`}
                            onClick={async e => {
                                e.preventDefault();
                                theme.invite != null && openInviteModal(theme.invite).catch(() => showToast({ text: tr("loader.settings.invalid.or.expired.invite", "Invalid or expired invite"), variant: "critical" }));
                            }}
                        >
                            {tr("loader.settings.discord.server", "Discord Server")}</Link>
                    )}
                </Flex>
            }
        />
    );
}
