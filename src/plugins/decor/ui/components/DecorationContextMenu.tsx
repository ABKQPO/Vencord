/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CopyIcon, DeleteIcon } from "@components/Icons";
import { Decoration } from "@plugins/decor/lib/api";
import { useCurrentUserDecorationsStore } from "@plugins/decor/lib/stores/CurrentUserDecorationsStore";
import { cl } from "@plugins/decor/ui";
import { copyToClipboard } from "@utils/clipboard";
import { tr, useLocale } from "@utils/localization";
import { ConfirmModal,ContextMenuApi, Menu, openModal, UserStore } from "@webpack/common";

export default function DecorationContextMenu({ decoration }: { decoration: Decoration; }) {
    useLocale();
    const { delete: deleteDecoration } = useCurrentUserDecorationsStore();

    return <Menu.Menu
        navId={cl("decoration-context-menu")}
        onClose={ContextMenuApi.closeContextMenu}
        aria-label={tr("plugins.Decor.decorationOptions", "Decoration Options")}
    >
        <Menu.MenuItem
            id={cl("decoration-context-menu-copy-hash")}
            label={tr("plugins.Decor.copyDecorationHash", "Copy Decoration Hash")}
            icon={CopyIcon}
            leadingAccessory={{ type: "icon", icon: CopyIcon }}
            action={() => copyToClipboard(decoration.hash)}
        />
        {decoration.authorId === UserStore.getCurrentUser().id &&
            <Menu.MenuItem
                id={cl("decoration-context-menu-delete")}
                label={tr("plugins.Decor.deleteDecoration", "Delete Decoration")}
                color="danger"
                icon={DeleteIcon}
                leadingAccessory={{ type: "icon", icon: DeleteIcon }}
                action={() => openModal(props => {
    useLocale();
    return (
                    <ConfirmModal
                        {...props}
                        title={tr("plugins.Decor.deleteDecoration", "Delete Decoration")}
                        subtitle={tr("plugins.Decor.areYouSureYouWantToDeleteName", "Are you sure you want to delete {name}?", { name: decoration.alt })}
                        confirmText={tr("plugins.Decor.delete", "Delete")}
                        cancelText={tr("plugins.Decor.cancel", "Cancel")}
                        onConfirm={() => {
                            deleteDecoration(decoration);
                        }}
                    />
                );
})}
            />
        }
    </Menu.Menu>;
}
