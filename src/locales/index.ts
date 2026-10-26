/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import commandsEnglish from "./en-US/commands.json";
import commonEnglish from "./en-US/common.json";
import loaderSettingsEnglish from "./en-US/loader-settings.json";
import pluginsEnglish from "./en-US/plugins.json";
import aToMEnglish from "./en-US/ui-a-m.json";
import nToZEnglish from "./en-US/ui-n-z.json";
import commandsChinese from "./zh-CN/commands.json";
import commonChinese from "./zh-CN/common.json";
import loaderSettingsChinese from "./zh-CN/loader-settings.json";
import pluginsChinese from "./zh-CN/plugins.json";
import aToMChinese from "./zh-CN/ui-a-m.json";
import nToZChinese from "./zh-CN/ui-n-z.json";

export const messages = {
    "en-US": { ...commonEnglish, ...commandsEnglish, ...loaderSettingsEnglish, ...aToMEnglish, ...nToZEnglish },
    "zh-CN": { ...commonChinese, ...commandsChinese, ...loaderSettingsChinese, ...aToMChinese, ...nToZChinese }
};

export const pluginMessages = { "en-US": pluginsEnglish, "zh-CN": pluginsChinese };
