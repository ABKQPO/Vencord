/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Divider } from "@components/Divider";
import { ErrorCard } from "@components/ErrorCard";
import { Link } from "@components/Link";
import { LocalizedText } from "@components/settings/tabs/LocalizedText";
import { CspBlockedUrls, useCspErrors } from "@utils/cspViolations";
import { getLocale, tr, useLocale } from "@utils/localization";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { promptToRestart } from "@utils/promptToRestart";
import { useForceUpdater } from "@utils/react";
import { Button, Forms } from "@webpack/common";

export function CspErrorCard() {
    useLocale();
    if (IS_WEB) return null;

    const errors = useCspErrors();
    const forceUpdate = useForceUpdater();

    if (!errors.length) return null;

    const isImgurHtmlDomain = (url: string) => url.startsWith("https://imgur.com/");

    const allowUrl = async (url: string) => {
        const { origin: baseUrl, host } = new URL(url);

        const result = await VencordNative.csp.requestAddOverride(baseUrl, ["connect-src", "img-src", "style-src", "font-src"], tr("loader.settings.vencord.themes", "Vencord Themes"), getLocale());
        if (result !== "ok") return;

        CspBlockedUrls.forEach(url => {
            if (new URL(url).host === host) {
                CspBlockedUrls.delete(url);
            }
        });

        forceUpdate();
        promptToRestart("relaunch");
    };

    const hasImgurHtmlDomain = errors.some(isImgurHtmlDomain);

    return (
        <ErrorCard>
            <Forms.FormTitle tag="h5">{tr("loader.settings.blocked.resources", "Blocked Resources")}</Forms.FormTitle>
            <Forms.FormText>{tr("loader.settings.some.images.styles.or.fonts.were.blocked.because.they.come.from.disallowed.domains", "Some images, styles, or fonts were blocked because they come from disallowed domains.")}</Forms.FormText>
            <Forms.FormText>{tr("loader.settings.it.is.highly.recommended.to.move.them.to.github.or.imgur.but.you.may.also.allow.domains.if.you.", "It is highly recommended to move them to GitHub or Imgur. But you may also allow domains if you fully trust them.")}</Forms.FormText>
            <Forms.FormText>
                <LocalizedText id="loader.settings.after.allowing.a.domain.you.have.to.fully.close.from.tray.task.manager.and.restart.app.to.apply" fallback="After allowing a domain, you have to fully close (from tray / task manager) and restart {app} to apply the change." slots={{ app: IS_DISCORD_DESKTOP ? "Discord" : "Vesktop" }} />
            </Forms.FormText>

            <Forms.FormTitle tag="h5" className={classes(Margins.top16, Margins.bottom8)}>{tr("loader.settings.blocked.urls", "Blocked URLs")}</Forms.FormTitle>
            <div className="vc-settings-csp-list">
                {errors.map((url, i) => (
                    <div key={url}>
                        {i !== 0 && <Divider className={Margins.bottom8} />}
                        <div className="vc-settings-csp-row">
                            <Link href={url}>{url}</Link>
                            <Button color={Button.Colors.PRIMARY} onClick={() => allowUrl(url)} disabled={isImgurHtmlDomain(url)}>
                                {tr("loader.settings.allow", "Allow")}</Button>
                        </div>
                    </div>
                ))}
            </div>

            {hasImgurHtmlDomain && (
                <>
                    <Divider className={classes(Margins.top8, Margins.bottom16)} />
                    <Forms.FormText>
                        <LocalizedText id="loader.settings.imgur.links.should.be.direct.links.in.the.form.of.example" fallback="Imgur links should be direct links in the form of {example}" slots={{ example: <code>https://i.imgur.com/...</code> }} />
                    </Forms.FormText>
                    <Forms.FormText>{tr("loader.settings.to.obtain.a.direct.link.right.click.the.image.and.select.copy.image.address", "To obtain a direct link, right-click the image and select \"Copy image address\".")}</Forms.FormText>
                </>
            )}
        </ErrorCard>
    );
}
