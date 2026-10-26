/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./settings.css";

import { isPluginEnabled } from "@api/PluginManager";
import { Divider } from "@components/Divider";
import { Heading } from "@components/Heading";
import { resolveError } from "@components/settings/tabs/plugins/components/Common";
import { debounce } from "@shared/debounce";
import { classNameFactory } from "@utils/css";
import { tr, useLocale } from "@utils/localization";
import { ActivityType } from "@vencord/discord-types/enums";
import { Select, Text, TextInput, useState } from "@webpack/common";

import CustomRPCPlugin, { setRpc, settings, TimestampMode } from ".";

const cl = classNameFactory("vc-customRPC-settings-");

type SettingsKey = keyof typeof settings.store;

interface TextOption<T> {
    settingsKey: SettingsKey;
    label: string;
    disabled?: boolean;
    transform?: (value: string) => T;
    isValid?: (value: T) => true | string;
}

interface SelectOption<T> {
    settingsKey: SettingsKey;
    label: string;
    disabled?: boolean;
    options: { label: string; value: T; default?: boolean; }[];
}

const makeValidator = (maxLength: number, isRequired = false) => (value: string) => {
    if (isRequired && !value) return tr("plugins.CustomRPC.thisFieldIsRequired", "This field is required.");
    if (value.length > maxLength) return tr("plugins.CustomRPC.mustBeNotLongerThanCountCharacters", "Must be not longer than {count} characters.", { count: maxLength });
    return true;
};

const maxLength128 = makeValidator(128);

function isAppIdValid(value: string) {
    if (!/^\d{16,21}$/.test(value)) return tr("plugins.CustomRPC.mustBeAValidDiscordID", "Must be a valid Discord ID.");
    return true;
}

const updateRPC = debounce(() => {
    setRpc(true);
    if (isPluginEnabled(CustomRPCPlugin.name)) setRpc();
});

function isStreamLinkDisabled() {
    return settings.store.type !== ActivityType.STREAMING;
}

function isStreamLinkValid(value: string) {
    if (!isStreamLinkDisabled() && !/https?:\/\/(www\.)?(twitch\.tv|youtube\.com)\/\w+/.test(value)) return tr("plugins.CustomRPC.streamingLinkMustBeAValidURL", "Streaming link must be a valid URL.");
    if (value && value.length > 512) return tr("plugins.CustomRPC.streamingLinkMustBeNotLongerThan512Characters", "Streaming link must be not longer than 512 characters.");
    return true;
}

function parseNumber(value: string) {
    return value ? parseInt(value, 10) : 0;
}

function isNumberValid(value: number) {
    if (isNaN(value)) return tr("plugins.CustomRPC.mustBeANumber", "Must be a number.");
    if (value < 0) return tr("plugins.CustomRPC.mustBeAPositiveNumber", "Must be a positive number.");
    return true;
}

function isUrlValid(value: string) {
    if (value && !/^https?:\/\/.+/.test(value)) return tr("plugins.CustomRPC.mustBeAValidURL", "Must be a valid URL.");
    return true;
}

function isImageKeyValid(value: string) {
    if (/https?:\/\/(cdn|media)\.discordapp\.(com|net)\//.test(value)) return tr("plugins.CustomRPC.donTUseADiscordLinkUseAnImgurImageLinkInstead", "Don't use a Discord link. Use an Imgur image link instead.");
    if (/https?:\/\/(?!i\.)?imgur\.com\//.test(value)) return tr("plugins.CustomRPC.imgurLinkMustBeADirectLinkToTheImageEGHttpsIImgurComRightClickTheImageAndClickCopyImageAddress", "Imgur link must be a direct link to the image (e.g. https://i.imgur.com/...). Right click the image and click 'Copy image address'");
    if (/https?:\/\/(?!media\.)?tenor\.com\//.test(value)) return tr("plugins.CustomRPC.tenorLinkMustBeADirectLinkToTheImageEGHttpsMediaTenorComRightClickTheGIFAndClickCopyImageAddres", "Tenor link must be a direct link to the image (e.g. https://media.tenor.com/...). Right click the GIF and click 'Copy image address'");
    return true;
}

function PairSetting<T>(props: { data: [TextOption<T>, TextOption<T>]; }) {
    const [left, right] = props.data;

    return (
        <div className={cl("pair")}>
            <SingleSetting {...left} />
            <SingleSetting {...right} />
        </div>
    );
}

function SingleSetting<T>({ settingsKey, label, disabled, isValid, transform }: TextOption<T>) {
    useLocale();
    const [state, setState] = useState(settings.store[settingsKey] ?? "");
    const [hasEdited, setHasEdited] = useState(false);
    const error = hasEdited ? resolveError(isValid?.(state as T) ?? true) : null;

    function handleChange(newValue: any) {
        if (transform) newValue = transform(newValue);

        const valid = isValid?.(newValue) ?? true;

        setState(newValue);
        setHasEdited(true);

        if (valid === true) {
            settings.store[settingsKey] = newValue;
            updateRPC();
        }
    }

    return (
        <div className={cl("single", { disabled })}>
            <Heading tag="h5">{label}</Heading>
            <TextInput
                type="text"
                placeholder={tr("plugins.CustomRPC.enterAValue", "Enter a value")}
                value={state}
                onChange={handleChange}
                disabled={disabled}
            />
            {error && <Text className={cl("error")} variant="text-sm/normal">{error}</Text>}
        </div>
    );
}

function SelectSetting<T>({ settingsKey, label, options, disabled }: SelectOption<T>) {
    useLocale();
    return (
        <div className={cl("single", { disabled })}>
            <Heading tag="h5">{label}</Heading>
            <Select
                placeholder={tr("plugins.CustomRPC.selectAnOption", "Select an option")}
                options={options}
                maxVisibleItems={5}
                closeOnSelect={true}
                select={v => {
                    settings.store[settingsKey] = v;
                    updateRPC();
                }}
                isSelected={v => v === settings.store[settingsKey]}
                serialize={v => String(v)}
                isDisabled={disabled}
            />
        </div>
    );
}

export function RPCSettings() {
    useLocale();
    const s = settings.use();

    return (
        <div className={cl("root")}>
            <SelectSetting
                settingsKey="type"
                label={tr("plugins.CustomRPC.activityType", "Activity Type")}
                options={[
                    {
                        label: tr("plugins.CustomRPC.playing", "Playing"),
                        value: ActivityType.PLAYING,
                        default: true
                    },
                    {
                        label: tr("plugins.CustomRPC.streaming", "Streaming"),
                        value: ActivityType.STREAMING
                    },
                    {
                        label: tr("plugins.CustomRPC.listening", "Listening"),
                        value: ActivityType.LISTENING
                    },
                    {
                        label: tr("plugins.CustomRPC.watching", "Watching"),
                        value: ActivityType.WATCHING
                    },
                    {
                        label: tr("plugins.CustomRPC.competing", "Competing"),
                        value: ActivityType.COMPETING
                    }
                ]}
            />

            <PairSetting data={[
                { settingsKey: "appID", label: tr("plugins.CustomRPC.applicationID", "Application ID"), isValid: isAppIdValid },
                { settingsKey: "appName", label: tr("plugins.CustomRPC.applicationName", "Application Name"), isValid: makeValidator(128, true) },
            ]} />

            <PairSetting data={[
                { settingsKey: "details", label: tr("plugins.CustomRPC.detailLine1", "Detail (line 1)"), isValid: maxLength128 },
                { settingsKey: "detailsURL", label: tr("plugins.CustomRPC.detailURL", "Detail URL"), isValid: isUrlValid },
            ]} />

            <PairSetting data={[
                { settingsKey: "state", label: tr("plugins.CustomRPC.stateLine2", "State (line 2)"), isValid: maxLength128 },
                { settingsKey: "stateURL", label: tr("plugins.CustomRPC.stateURL", "State URL"), isValid: isUrlValid },
            ]} />

            <SingleSetting
                settingsKey="streamLink"
                label={tr("plugins.CustomRPC.streamLinkTwitchOrYouTubeOnlyIfActivityTypeIsStreaming", "Stream Link (Twitch or YouTube, only if activity type is Streaming)")}
                disabled={s.type !== ActivityType.STREAMING}
                isValid={isStreamLinkValid}
            />

            <PairSetting data={[
                {
                    settingsKey: "partySize",
                    label: tr("plugins.CustomRPC.partySize", "Party Size"),
                    transform: parseNumber,
                    isValid: isNumberValid,
                    disabled: s.type !== ActivityType.PLAYING,
                },
                {
                    settingsKey: "partyMaxSize",
                    label: tr("plugins.CustomRPC.maximumPartySize", "Maximum Party Size"),
                    transform: parseNumber,
                    isValid: isNumberValid,
                    disabled: s.type !== ActivityType.PLAYING,
                },
            ]} />

            <Divider />

            <PairSetting data={[
                { settingsKey: "imageBig", label: tr("plugins.CustomRPC.largeImageURLKey", "Large Image URL/Key"), isValid: isImageKeyValid },
                { settingsKey: "imageBigTooltip", label: tr("plugins.CustomRPC.largeImageText", "Large Image Text"), isValid: maxLength128 },
            ]} />
            <SingleSetting settingsKey="imageBigURL" label={tr("plugins.CustomRPC.largeImageClickableURL", "Large Image clickable URL")} isValid={isUrlValid} />

            <PairSetting data={[
                { settingsKey: "imageSmall", label: tr("plugins.CustomRPC.smallImageURLKey", "Small Image URL/Key"), isValid: isImageKeyValid },
                { settingsKey: "imageSmallTooltip", label: tr("plugins.CustomRPC.smallImageText", "Small Image Text"), isValid: maxLength128 },
            ]} />
            <SingleSetting settingsKey="imageSmallURL" label={tr("plugins.CustomRPC.smallImageClickableURL", "Small Image clickable URL")} isValid={isUrlValid} />

            <Divider />

            <PairSetting data={[
                { settingsKey: "buttonOneText", label: tr("plugins.CustomRPC.button1Text", "Button1 Text"), isValid: makeValidator(31) },
                { settingsKey: "buttonOneURL", label: tr("plugins.CustomRPC.button1URL", "Button1 URL"), isValid: isUrlValid },
            ]} />
            <PairSetting data={[
                { settingsKey: "buttonTwoText", label: tr("plugins.CustomRPC.button2Text", "Button2 Text"), isValid: makeValidator(31) },
                { settingsKey: "buttonTwoURL", label: tr("plugins.CustomRPC.button2URL", "Button2 URL"), isValid: isUrlValid },
            ]} />

            <Divider />

            <SelectSetting
                settingsKey="timestampMode"
                label={tr("plugins.CustomRPC.timestampMode", "Timestamp Mode")}
                options={[
                    {
                        label: tr("plugins.CustomRPC.none", "None"),
                        value: TimestampMode.NONE,
                        default: true
                    },
                    {
                        label: tr("plugins.CustomRPC.sinceDiscordOpen", "Since discord open"),
                        value: TimestampMode.NOW
                    },
                    {
                        label: tr("plugins.CustomRPC.sameAsYourCurrentTimeNotResetAfter24h", "Same as your current time (not reset after 24h)"),
                        value: TimestampMode.TIME
                    },
                    {
                        label: tr("plugins.CustomRPC.custom", "Custom"),
                        value: TimestampMode.CUSTOM
                    }
                ]}
            />

            <PairSetting data={[
                {
                    settingsKey: "startTime",
                    label: tr("plugins.CustomRPC.startTimestampInMilliseconds", "Start Timestamp (in milliseconds)"),
                    transform: parseNumber,
                    isValid: isNumberValid,
                    disabled: s.timestampMode !== TimestampMode.CUSTOM,
                },
                {
                    settingsKey: "endTime",
                    label: tr("plugins.CustomRPC.endTimestampInMilliseconds", "End Timestamp (in milliseconds)"),
                    transform: parseNumber,
                    isValid: isNumberValid,
                    disabled: s.timestampMode !== TimestampMode.CUSTOM,
                },
            ]} />
        </div>
    );
}
