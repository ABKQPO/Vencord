/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { FormSwitch } from "@components/FormSwitch";
import { tr, useLocale } from "@utils/localization";
import { Margins } from "@utils/margins";
import { Forms, Parser, TextInput, useEffect, useState } from "@webpack/common";

import { localizePatchError } from "./localizeError";

function getRegexGuide() { return {
    "\\i": tr("loader.settings.special.regex.escape.sequence.that.matches.identifiers.varnames.classnames.etc", "Special regex escape sequence that matches identifiers (varnames, classnames, etc.)"),
    "$$": tr("loader.settings.insert.a", "Insert a $"),
    "$&": tr("loader.settings.insert.the.entire.match", "Insert the entire match"),
    "$`\u200b": tr("loader.settings.insert.the.substring.before.the.match", "Insert the substring before the match"),
    "$'": tr("loader.settings.insert.the.substring.after.the.match", "Insert the substring after the match"),
    "$n": tr("loader.settings.insert.the.nth.capturing.group.1.2", "Insert the nth capturing group ($1, $2...)"),
    "$self": tr("loader.settings.insert.the.plugin.instance", "Insert the plugin instance"),
} as const; }

export function ReplacementInput({ replacement, setReplacement, replacementError }) {
    useLocale();
    const [isFunc, setIsFunc] = useState(false);
    const [error, setError] = useState<string>();

    function onChange(v: string) {
        setError(void 0);

        if (isFunc) {
            try {
                const func = (0, eval)(v);
                if (typeof func === "function")
                    setReplacement(() => func);

                else
                    setError("Replacement must be a function");
            } catch (e) {
                setReplacement(v);
                setError((e as Error).message);
            }
        } else {
            setReplacement(v);
        }
    }

    useEffect(() => {
        if (isFunc)
            onChange(replacement);
        else
            setError(void 0);
    }, [isFunc]);

    return (
        <>
            {/* FormTitle adds a class if className is not set, so we set it to an empty string to prevent that */}
            <Forms.FormTitle className="">{tr("loader.settings.replacement", "Replacement")}</Forms.FormTitle>
            <TextInput
                value={replacement?.toString()}
                onChange={onChange}
                error={localizePatchError(error ?? replacementError)}
            />
            {!isFunc && (
                <div>
                    <Forms.FormTitle className={Margins.top8}>{tr("loader.settings.cheat.sheet", "Cheat Sheet")}</Forms.FormTitle>

                    {Object.entries(getRegexGuide()).map(([placeholder, desc]) => (
                        <Forms.FormText key={placeholder}>
                            {Parser.parse("`" + placeholder + "`")}: {desc}
                        </Forms.FormText>
                    ))}
                </div>
            )}

            <FormSwitch
                className={Margins.top16}
                value={isFunc}
                onChange={setIsFunc}
                title={tr("loader.settings.treat.replacement.as.function", "Treat Replacement as function")}
                description={tr("loader.settings.replacement.will.be.evaluated.as.a.function.if.this.is.enabled", "\"Replacement\" will be evaluated as a function if this is enabled")}
                hideBorder
            />
        </>
    );
}
