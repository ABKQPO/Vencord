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

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { tr } from "@utils/localization";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";


const getPresetQuotes = () => [tr("plugins.LoadingQuotes.preset1", "Explode"), tr("plugins.LoadingQuotes.preset2", "Read if cute"), tr("plugins.LoadingQuotes.preset3", "Have a nice day!"), tr("plugins.LoadingQuotes.preset4", "Starting Lightcord..."), tr("plugins.LoadingQuotes.preset5", "Loading 0BDFDB.plugin.js..."), tr("plugins.LoadingQuotes.preset6", "Installing BetterDiscord..."), tr("plugins.LoadingQuotes.preset7", "h"), tr("plugins.LoadingQuotes.preset8", "shhhhh did you know that you're my favourite user? But don't tell the others!!"), tr("plugins.LoadingQuotes.preset9", "Today's video is sponsored by Raid Shadow Legends, one of the biggest mobile role-playing games of 2019 and it's totally free!"), tr("plugins.LoadingQuotes.preset10", "Never gonna give you up, Never gonna let you down"), tr("plugins.LoadingQuotes.preset11", "( ͡° ͜ʖ ͡°)"), tr("plugins.LoadingQuotes.preset12", "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧"), tr("plugins.LoadingQuotes.preset13", "You look so pretty today!"), tr("plugins.LoadingQuotes.preset14", "Thinking of a funny quote..."), tr("plugins.LoadingQuotes.preset15", "3.141592653589793"), tr("plugins.LoadingQuotes.preset16", "meow"), tr("plugins.LoadingQuotes.preset17", "Welcome, friend"), tr("plugins.LoadingQuotes.preset18", "If you, or someone you love, has Ligma, please see the Ligma health line at https://bit.ly/ligma_hotline"), tr("plugins.LoadingQuotes.preset19", "Trans Rights"), tr("plugins.LoadingQuotes.preset20", "I’d just like to interject for a moment. What you’re refering to as Linux, is in fact, GNU/Linux, or as I’ve recently taken to calling it, GNU plus Linux."), tr("plugins.LoadingQuotes.preset21", "You're doing good today!"), tr("plugins.LoadingQuotes.preset22", "Don't worry, it's nothing 9 cups of coffee couldn't solve!"), tr("plugins.LoadingQuotes.preset23", "�(repeat like 30 times)"), tr("plugins.LoadingQuotes.preset24", "a light amount of tomfoolery is okay"), tr("plugins.LoadingQuotes.preset25", "do you love?"), tr("plugins.LoadingQuotes.preset26", "horror"), tr("plugins.LoadingQuotes.preset27", "so eepy"), tr("plugins.LoadingQuotes.preset28", "So without further ado, let's just jump right into it!"), tr("plugins.LoadingQuotes.preset29", "Dying is absolutely safe"), tr("plugins.LoadingQuotes.preset30", "hey you! you're cute :))"), tr("plugins.LoadingQuotes.preset31", "heya ~"), tr("plugins.LoadingQuotes.preset32", "<:trolley:997086295010594867>"), tr("plugins.LoadingQuotes.preset33", "Time is gone, space is insane. Here it comes, here again."), tr("plugins.LoadingQuotes.preset34", "sometimes it's okay to just guhhhhhhhhhhhhhh"), tr("plugins.LoadingQuotes.preset35", "Welcome to nginx!")];
const getNoQuotesQuote = () => tr("plugins.LoadingQuotes.noQuotes", "Did you really disable all loading quotes? What a buffoon you are...");

const settings = definePluginSettings({
    replaceEvents: {
        description: "Should this plugin also apply during events with special event themed quotes? (e.g. Halloween)",
        type: OptionType.BOOLEAN,
        default: true
    },
    enablePluginPresetQuotes: {
        description: "Enable the quotes preset by this plugin",
        type: OptionType.BOOLEAN,
        default: true
    },
    enableDiscordPresetQuotes: {
        description: "Enable Discord's preset quotes (including event quotes, during events)",
        type: OptionType.BOOLEAN,
        default: false
    },
    additionalQuotes: {
        description: "Additional custom quotes to possibly appear, separated by the below delimiter",
        type: OptionType.STRING,
        default: "",
        multiline: true
    },
    additionalQuotesDelimiter: {
        description: "Delimiter for additional quotes",
        type: OptionType.STRING,
        default: "|",
    },
});

export default definePlugin({
    name: "LoadingQuotes",
    description: "Replace Discords loading quotes",
    tags: ["Appearance", "Fun", "Customisation"],
    authors: [Devs.Ven, Devs.KraXen72, Devs.UlyssesZhan],

    settings,

    patches: [
        {
            find: "#{intl::LOADING_DID_YOU_KNOW}",
            replacement: [
                {
                    match: /_loadingText.+?(?=(\i)\[.{0,10}\.random)/,
                    replace: "$&$self.mutateQuotes($1),"
                },
                {
                    match: /_eventLoadingText.+?(?=(\i)\[.{0,10}\.random)/,
                    replace: "$&$self.mutateQuotes($1),",
                    predicate: () => settings.store.replaceEvents
                }
            ]
        },
    ],

    mutateQuotes(quotes: string[]) {
        try {
            const { enableDiscordPresetQuotes, additionalQuotes, additionalQuotesDelimiter, enablePluginPresetQuotes } = settings.store;

            if (!enableDiscordPresetQuotes)
                quotes.length = 0;


            if (enablePluginPresetQuotes)
                quotes.push(...getPresetQuotes());

            quotes.push(...additionalQuotes.split(additionalQuotesDelimiter).filter(Boolean));

            if (!quotes.length)
                quotes.push(getNoQuotesQuote());
        } catch (e) {
            new Logger("LoadingQuotes").error("Failed to mutate quotes", e);
        }
    }
});
