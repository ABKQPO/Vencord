/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
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

import { tr } from "@utils/localization";
import { mergeDefaults } from "@utils/mergeDefaults";
import { CommandArgument, Message } from "@vencord/discord-types";
import { findByCodeLazy } from "@webpack";
import { MessageActions, SnowflakeUtils } from "@webpack/common";
import type { PartialDeep } from "type-fest";

const createBotMessage = findByCodeLazy('username:"Clyde"');

export function generateId() {
    return `-${SnowflakeUtils.fromTimestamp(Date.now())}`;
}

/**
 * Send a message as Clyde
 * @param {string} channelId ID of channel to send message to
 * @param {Message} message Message to send
 * @returns {Message}
 */
export function sendBotMessage(channelId: string, message: PartialDeep<Message>): Message {
    const botMessage = createBotMessage({ channelId, content: "", embeds: [] });

    MessageActions.receiveMessage(channelId, mergeDefaults(message, botMessage));

    return message as Message;
}

/**
 * Get the value of an option by name
 * @param args Arguments array (first argument passed to execute)
 * @param name Name of the argument
 * @param fallbackValue Fallback value in case this option wasn't passed
 * @returns Value
 */
export function findOption<T>(args: CommandArgument[], name: string): T & {} | undefined;
export function findOption<T>(args: CommandArgument[], name: string, fallbackValue: T): T & {};
export function findOption(args: CommandArgument[], name: string, fallbackValue?: any) {
    return (args.find(a => a.name === name)?.value ?? fallbackValue) as any;
}

/** Localize known stock command descriptions without interpreting custom command text. */
export function getCommandDescription(plugin: string, path: string, fallback: string): string {
    switch (plugin + ":" + path) {
        case "petpet:petpet": return tr("commands.petpet.petpet.description", "Create a petpet gif. You can only specify one of the image options");
        case "petpet:petpet.delay": return tr("commands.petpet.petpet.delay.description", "The delay between each frame in ms. Rounded to nearest 10ms. Defaults to the minimum value of 20.");
        case "petpet:petpet.resolution": return tr("commands.petpet.petpet.resolution.description", "Resolution for the gif. Defaults to 120. If you enter an insane number and it freezes Discord that's your fault.");
        case "petpet:petpet.image": return tr("commands.petpet.petpet.image.description", "Image attachment to use");
        case "petpet:petpet.url": return tr("commands.petpet.petpet.url.description", "URL to fetch image from");
        case "petpet:petpet.user": return tr("commands.petpet.petpet.user.description", "User whose avatar to use as image");
        case "petpet:petpet.no-server-pfp": return tr("commands.petpet.petpet.no-server-pfp.description", "Use the normal avatar instead of the server specific one when using the 'user' option");
        case "SilentTyping:silenttype": return tr("commands.SilentTyping.silenttype.description", "Toggle whether you're hiding that you're typing or not.");
        case "SilentTyping:silenttype.value": return tr("commands.SilentTyping.silenttype.value.description", "Whether to hide or not that you're typing (default is toggle)");
        case "SupportHelper:vencord-debug": return tr("commands.SupportHelper.vencord-debug.description", "Send Vencord debug info");
        case "SupportHelper:vencord-plugins": return tr("commands.SupportHelper.vencord-plugins.description", "Send Vencord plugin list");
        case "SpotifyShareCommands:track": return tr("commands.SpotifyShareCommands.track.description", "Share your current Spotify track in chat");
        case "SpotifyShareCommands:album": return tr("commands.SpotifyShareCommands.album.description", "Share your current Spotify album in chat");
        case "SpotifyShareCommands:artist": return tr("commands.SpotifyShareCommands.artist.description", "Share your current Spotify artist in chat");
        default: return fallback;
    }
}

/** Preserve an explicit display getter while avoiding a snapshot of description getters. */
export function prepareCommandDescription(option: { description: string; displayDescription?: string; }, plugin: string, path: string) {
    const display = Object.getOwnPropertyDescriptor(option, "displayDescription");
    if (display?.get || display?.value) return;
    Object.defineProperty(option, "displayDescription", {
        configurable: true,
        enumerable: true,
        get: () => getCommandDescription(plugin, path, option.description)
    });
}
