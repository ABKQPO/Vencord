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

import { ApplicationCommandInputType, sendBotMessage } from "@api/Commands";
import { Devs } from "@utils/constants";
import { tr } from "@utils/localization";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";

const FriendInvites = findByPropsLazy("createFriendInvite");

export default definePlugin({
    name: "FriendInvites",
    description: "Create and manage friend invite links via slash commands (/create friend invite, /view friend invites, /revoke friend invites).",
    tags: ["Friends", "Commands"],
    authors: [Devs.afn, Devs.Dziurwa],
    commands: [
        {
            name: "create friend invite",
            get description() { return tr("plugins.FriendInvites.generatesAFriendInviteLink", "Generates a friend invite link."); },
            inputType: ApplicationCommandInputType.BUILT_IN,

            execute: async (args, ctx) => {
                const invite = await FriendInvites.createFriendInvite();

                sendBotMessage(ctx.channel.id, {
                    content: tr("plugins.FriendInvites.inviteCreated", "{link} · Expires: {expiry} · Max uses: {uses}", { link: "discord.gg/" + invite.code, expiry: "<t:" + Math.round(new Date(invite.expires_at).getTime() / 1000) + ":R>", uses: invite.max_uses }).trim().replace(/\s+/g, " ")
                });
            }
        },
        {
            name: "view friend invites",
            get description() { return tr("plugins.FriendInvites.viewAListOfAllGeneratedFriendInvites", "View a list of all generated friend invites."); },
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute: async (_, ctx) => {
                const invites = await FriendInvites.getAllFriendInvites();
                const friendInviteList = invites.map(i =>
                    tr("plugins.FriendInvites.inviteListItem", "{link} · Expires: {expiry} · Times used: {uses}/{max}", { link: "_discord.gg/" + i.code + "_", expiry: "<t:" + Math.round(new Date(i.expires_at).getTime() / 1000) + ":R>", uses: i.uses, max: i.max_uses }).trim().replace(/\s+/g, " ")
                );

                sendBotMessage(ctx.channel.id, {
                    content: friendInviteList.join("\n") || tr("plugins.FriendInvites.noInvites", "You have no active friend invites!")
                });
            },
        },
        {
            name: "revoke friend invites",
            get description() { return tr("plugins.FriendInvites.revokesAllGeneratedFriendInvites", "Revokes all generated friend invites."); },
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute: async (_, ctx) => {
                await FriendInvites.revokeFriendInvites();

                sendBotMessage(ctx.channel.id, {
                    content: tr("plugins.FriendInvites.invitesRevoked", "All friend invites have been revoked.")
                });
            },
        },
    ]
});
