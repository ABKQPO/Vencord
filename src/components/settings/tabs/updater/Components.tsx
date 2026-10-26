/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Card } from "@components/Card";
import { ErrorCard } from "@components/ErrorCard";
import { Flex } from "@components/Flex";
import { Link } from "@components/Link";
import { tr, useLocale } from "@utils/localization";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { relaunch } from "@utils/native";
import { changes, checkForUpdates, update, updateError } from "@utils/updater";
import { Button, ConfirmModal, Forms, openModal, React, showToast, useState } from "@webpack/common";

import { runWithDispatch } from "./runWithDispatch";

export interface CommonProps {
    repo: string;
    repoPending: boolean;
}

export function HashLink({ repo, hash, disabled = false }: { repo: string, hash: string, disabled?: boolean; }) {
    return (
        <Link href={`${repo}/commit/${hash}`} disabled={disabled}>
            {hash}
        </Link>
    );
}

export function Changes({ updates, repo, repoPending }: CommonProps & { updates: typeof changes; }) {
    return (
        <Card style={{ padding: "0 0.5em" }} defaultPadding={false}>
            {updates.map(({ hash, author, message }) => (
                <div
                    key={hash}
                    style={{
                        marginTop: "0.5em",
                        marginBottom: "0.5em"
                    }}
                >
                    <code>
                        <HashLink {...{ repo, hash }} disabled={repoPending} />
                    </code>

                    <span style={{
                        marginLeft: "0.5em",
                        color: "var(--text-default)"
                    }}>
                        {message} - {author}
                    </span>
                </div>
            ))}
        </Card>
    );
}

export function Newer(props: CommonProps) {
    useLocale();
    return (
        <>
            <Forms.FormText className={Margins.bottom8}>
                {tr("loader.settings.your.local.copy.has.more.recent.commits.please.stash.or.reset.them", "Your local copy has more recent commits. Please stash or reset them.")}</Forms.FormText>
            <Changes {...props} updates={changes} />
        </>
    );
}

export function Updatable(props: CommonProps) {
    useLocale();
    const [updates, setUpdates] = useState(changes);
    const [isChecking, setIsChecking] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const isOutdated = (updates?.length ?? 0) > 0;

    return (
        <>
            {!updates && updateError ? (
                <>
                    <Forms.FormText>{tr("loader.settings.failed.to.check.updates.check.the.console.for.more.info", "Failed to check updates. Check the console for more info")}</Forms.FormText>
                    <ErrorCard style={{ padding: "1em" }}>
                        <p>{updateError.stderr || updateError.stdout || tr("loader.settings.an.unknown.error.occurred", "An unknown error occurred")}</p>
                    </ErrorCard>
                </>
            ) : (
                <Forms.FormText className={Margins.bottom8}>
                    {isOutdated ? tr("loader.settings.updateCount", updates.length === 1 ? "There is {count} Update" : "There are {count} Updates", { count: updates.length }) : tr("loader.settings.up.to.date", "Up to Date!")}
                </Forms.FormText>
            )}

            {isOutdated && <Changes updates={updates} {...props} />}

            <Flex className={classes(Margins.bottom8, Margins.top8)}>
                {isOutdated && (
                    <Button
                        disabled={isUpdating || isChecking}
                        onClick={runWithDispatch(setIsUpdating, async () => {
                            if (await update()) {
                                setUpdates([]);

                                await new Promise<void>(r => {
                                    openModal(function LocalizedModal(props) {
                useLocale();
                return (<ConfirmModal
                                            {...props}
                                            title={tr("loader.settings.update.success", "Update Success!")}
                                            subtitle={tr("loader.settings.successfully.updated.restart.now.to.apply.the.changes", "Successfully updated. Restart now to apply the changes?")}
                                            confirmText={tr("loader.settings.restart", "Restart")}
                                            cancelText={tr("loader.settings.not.now", "Not now!")}
                                            variant="primary"
                                            onConfirm={() => {
                                                relaunch();
                                                r();
                                            }}
                                            onCancel={r}
                                        />);
            });
                                });
                            }
                        })}
                    >
                        {tr("loader.settings.update.now", "Update Now")}</Button>
                )}
                <Button
                    disabled={isUpdating || isChecking}
                    onClick={runWithDispatch(setIsChecking, async () => {
                        const outdated = await checkForUpdates();

                        if (outdated) {
                            setUpdates(changes);
                        } else {
                            setUpdates([]);

                            showToast({ text: tr("loader.settings.no.updates.found", "No updates found!"), position: "bottom" });
                        }
                    })}
                >
                    {tr("loader.settings.check.for.updates", "Check for Updates")}</Button>
            </Flex>
        </>
    );
}
