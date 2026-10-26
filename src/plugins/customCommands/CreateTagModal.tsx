/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { InlineCode } from "@components/CodeBlock";
import { ExpandableSection } from "@components/ExpandableCard";
import { Flex } from "@components/Flex";
import { HeadingSecondary } from "@components/Heading";
import { InfoIcon } from "@components/Icons";
import { Paragraph } from "@components/Paragraph";
import { tr, useLocale } from "@utils/localization";
import { RenderModalProps } from "@vencord/discord-types";
import { Modal, openModal, TextArea, TextInput, useState } from "@webpack/common";

import { parseTagArguments } from ".";
import { addTag, getTag, removeTag, Tag } from "./settings";

export function openCreateTagModal(initialValue: Tag = { name: "", message: "" }) {
    openModal(modalProps => (
        <CreateTagDialog initialValue={initialValue} modalProps={modalProps} />
    ));
}

const EXAMPLE_RESPONSE = "Hello {{user}}! I am feeling {{mood = great}}.";

function CreateTagDialog({ initialValue, modalProps }: { initialValue: Tag; modalProps: RenderModalProps; }) {
    useLocale();
    const [name, setName] = useState(initialValue.name);
    const [message, setMessage] = useState(initialValue.message.replaceAll("\\n", "\n"));

    const isEdit = Boolean(initialValue.name);

    const detectedArguments = parseTagArguments(message);
    const hasReservedEphemeral = detectedArguments.some(arg => arg.name === "ephemeral");
    const nameAlreadyExists = name !== initialValue.name && getTag(name);

    const notice = hasReservedEphemeral
        ? tr("plugins.CustomCommands.theArgumentNameEphemeralIsReservedAndCannotBeUsed", "The argument name \"ephemeral\" is reserved and cannot be used.")
        : nameAlreadyExists
            ? tr("plugins.CustomCommands.aTagWithTheNameNameAlreadyExistsAndWillBeOverwritten", "A tag with the name \"{name}\" already exists and will be overwritten.", { name })
            : undefined;

    return (
        <Modal
            {...modalProps}
            title={isEdit ? tr("plugins.CustomCommands.editTag", "Edit Tag") : tr("plugins.CustomCommands.createNewTag", "Create New Tag")}
            subtitle={isEdit ? tr("plugins.CustomCommands.editYourCustomCommand", "Edit your custom command.") : tr("plugins.CustomCommands.createANewTagWhichWillBeRegisteredAsASlashCommand", "Create a new tag which will be registered as a slash command.")}
            actions={[
                {
                    text: tr("plugins.CustomCommands.cancel", "Cancel"),
                    variant: "secondary",
                    onClick: modalProps.onClose
                },
                {
                    text: isEdit ? tr("plugins.CustomCommands.save", "Save") : tr("plugins.CustomCommands.create", "Create"),
                    variant: "primary",
                    onClick: () => {
                        if (isEdit && initialValue.name !== name) {
                            removeTag(initialValue.name);
                        }

                        const tag = { name, message };
                        addTag(tag);
                        modalProps.onClose();
                    },
                    disabled: !name || !message || hasReservedEphemeral
                }
            ]}
            notice={notice ? { message: notice, type: "critical" } : undefined}
        >
            <Flex flexDirection="column" gap={12}>
                <section>
                    <HeadingSecondary>{tr("plugins.CustomCommands.name", "Name")}</HeadingSecondary>
                    <TextInput value={name} onChange={setName} placeholder="greet" />
                </section>

                <section>
                    <HeadingSecondary>{tr("plugins.CustomCommands.response", "Response")}</HeadingSecondary>
                    <TextArea value={message} onChange={setMessage} placeholder={EXAMPLE_RESPONSE} autosize />
                </section>

                {detectedArguments.length > 0 && (
                    <section>
                        <HeadingSecondary>{tr("plugins.CustomCommands.detectedArguments", "Detected Arguments")}</HeadingSecondary>
                        <Paragraph>
                            <ul>
                                {detectedArguments.map(arg => (
                                    <li key={arg.name}>
                                        &mdash; <b>{arg.name}</b>{arg.defaultValue ? tr("plugins.CustomCommands.defaultValue", " (default: {value})", { value: arg.defaultValue }) : ""}
                                    </li>
                                ))}
                            </ul>
                        </Paragraph>
                    </section>
                )}

                <ExpandableSection
                    renderContent={() => (
                        <Flex flexDirection="column" gap={12}>
                            <Paragraph>
                                {tr("plugins.CustomCommands.yourResponseCanIncludeVariablesWrappedInDoubleCurlyBracesWhichWillBecomeCommandArgumentsForExam", "Your response can include variables wrapped in double curly braces which will become command arguments, for example")} <InlineCode>{"Hello {{user}}"}</InlineCode>.
                            </Paragraph>
                            <Paragraph>
                                {tr("plugins.CustomCommands.youCanSpecifyArgumentsWithDefaultValuesByUsingAnEqualsSignForExample", "You can specify arguments with default values by using an equals sign, for example")} <InlineCode>{"Hello {{user = pal}}"}</InlineCode>.
                            </Paragraph>

                            <section>
                                <Paragraph><b>{tr("plugins.CustomCommands.exampleCommandResponse", "Example Command response:")}</b> <InlineCode>{EXAMPLE_RESPONSE}</InlineCode></Paragraph>
                                <Paragraph><b>{tr("plugins.CustomCommands.exampleUsage", "Example usage:")}</b> <InlineCode>{"/greet user:@Clyde"}</InlineCode></Paragraph>
                                <Paragraph><b>{tr("plugins.CustomCommands.exampleOutput", "Example output:")}</b> <InlineCode>{"Hello @Clyde! I am feeling great."}</InlineCode></Paragraph>
                            </section>
                        </Flex>
                    )}
                >
                    <Flex alignItems="center" gap={8}>
                        <InfoIcon color="var(--text-muted)" height={16} width={16} />
                        {tr("plugins.CustomCommands.viewArgumentsGuide", "View Arguments guide")}
                    </Flex>
                </ExpandableSection>
            </Flex>
        </Modal>
    );
}
