/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { BaseText } from "@components/BaseText";
import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { DeleteIcon, PencilIcon } from "@components/Icons";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { tr, useLocale } from "@utils/localization";

import { openCreateTagModal } from "./CreateTagModal";
import { removeTag, settings } from "./settings";

export function SettingsTagList() {
    useLocale();
    const { tagsList } = settings.use(["tagsList"]);

    return (
        <section className={Margins.top8}>
            <BaseText size="md" weight="semibold">{tr("plugins.CustomCommands.registeredTags", "Registered Tags")}</BaseText>
            <Flex flexDirection="column" gap="0.5em" className={Margins.top8}>
                {Object.values(tagsList).map(tag => (
                    <Card key={tag.name} className="vc-customCommands-card">
                        <Paragraph size="md" weight="medium">{tag.name}</Paragraph>

                        <Button variant="secondary" size="iconOnly" onClick={() => openCreateTagModal(tag)}>
                            <PencilIcon aria-label={tr("plugins.CustomCommands.editTag", "Edit Tag")} width={20} height={20} />
                        </Button>
                        <Button variant="dangerSecondary" size="iconOnly" onClick={() => removeTag(tag.name)}>
                            <DeleteIcon aria-label={tr("plugins.CustomCommands.deleteTag", "Delete Tag")} width={20} height={20} />
                        </Button>
                    </Card>
                ))}
                <Button onClick={() => openCreateTagModal()}>{tr("plugins.CustomCommands.createTag", "Create Tag")}</Button>
            </Flex>
        </section>
    );
}
