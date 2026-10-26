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

import { useSettings } from "@api/Settings";
import { authorizeCloud, deauthorizeCloud } from "@api/SettingsSync/cloudSetup";
import { deleteCloudSettings, eraseAllCloudData, getCloudSettings, getCloudSyncDirection, putCloudSettings, setCloudSyncDirection } from "@api/SettingsSync/cloudSync";
import { BaseText } from "@components/BaseText";
import { Button, ButtonProps } from "@components/Button";
import { CheckedTextInput } from "@components/CheckedTextInput";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { Grid } from "@components/Grid";
import { Heading } from "@components/Heading";
import { CloudDownloadIcon, CloudUploadIcon, DeleteIcon, RestartIcon } from "@components/Icons";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { LocalizedText } from "@components/settings/tabs/LocalizedText";
import { tr, useLocale } from "@utils/localization";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { IconComponent } from "@utils/types";
import { ConfirmModal,openModal, Select, Tooltip, useState } from "@webpack/common";

function validateUrl(url: string) {
    try {
        new URL(url);
        return true;
    } catch {
        return tr("loader.settings.invalid.url", "Invalid URL");
    }
}

const SectionHeading = ({ text }: { text: string; }) => (
    <BaseText
        tag="h5"
        size="lg"
        weight="semibold"
        className={Margins.bottom16}
    >
        {text}
    </BaseText>
);

function ButtonWithIcon({ children, Icon, className, ...buttonProps }: ButtonProps & { Icon: IconComponent; }) {
    return (
        <Button {...buttonProps} className={classes("vc-cloud-icon-with-button", className)}>
            <Icon className={"vc-cloud-button-icon"} />
            {children}
        </Button>
    );
}

function CloudSetupSection() {
    useLocale();
    const { cloud } = useSettings(["cloud.authenticated", "cloud.url"]);

    return (
        <section>
            <SectionHeading text={tr("loader.settings.cloud.integrations", "Cloud Integrations")} />

            <Paragraph size="md" className={Margins.bottom20}>
                <LocalizedText id="loader.settings.vencord.comes.with.a.cloud.integration.that.adds.goodies.like.settings.sync.across.devices.it.p" fallback="Vencord comes with a cloud integration that adds goodies like settings sync across devices. It {privacy}, and the {source} is AGPL 3.0 licensed so you can host it yourself." slots={{ privacy: <Link href="https://vencord.dev/cloud/privacy">{tr("loader.settings.respects.your.privacy", "respects your privacy")}</Link>, source: <Link href="https://github.com/Vencord/Backend">{tr("loader.settings.source.code", "source code")}</Link> }} />
            </Paragraph>
            <FormSwitch
                key="backend"
                title={tr("loader.settings.enable.cloud.integrations", "Enable Cloud Integrations")}
                description={tr("loader.settings.this.will.request.authorization.if.you.have.not.yet.set.up.cloud.integrations", "This will request authorization if you have not yet set up cloud integrations.")}
                value={cloud.authenticated}
                onChange={v => {
                    if (v)
                        authorizeCloud();
                    else
                        cloud.authenticated = v;
                }}
            />
            <Heading tag="h5" className={Margins.top16}>{tr("loader.settings.backend.url", "Backend URL")}</Heading>
            <Paragraph className={Margins.bottom8}>
                {tr("loader.settings.which.backend.to.use.when.using.cloud.integrations", "Which backend to use when using cloud integrations.")}</Paragraph>
            <CheckedTextInput
                key="backendUrl"
                initialValue={cloud.url}
                onChange={async v => {
                    cloud.url = v;
                    cloud.authenticated = false;
                    deauthorizeCloud();
                }}
                validate={validateUrl}
            />

            <Grid columns={1} gap="1em" className={Margins.top8}>
                <ButtonWithIcon
                    variant="primary"
                    disabled={!cloud.authenticated}
                    onClick={async () => {
                        await deauthorizeCloud();
                        cloud.authenticated = false;
                        await authorizeCloud();
                    }}
                    Icon={RestartIcon}
                >
                    {tr("loader.settings.reauthorise", "Reauthorise")}</ButtonWithIcon>
            </Grid>
        </section>
    );
}

function SettingsSyncSection() {
    useLocale();
    const { cloud } = useSettings(["cloud.authenticated", "cloud.settingsSync"]);
    const [syncDirection, setSyncDirection] = useState(getCloudSyncDirection);
    const sectionEnabled = cloud.authenticated && cloud.settingsSync;

    return (
        <section>
            <SectionHeading text={tr("loader.settings.settings.sync", "Settings Sync")} />
            <Flex flexDirection="column" gap="1em">
                <FormSwitch
                    key="cloud-sync"
                    title={tr("loader.settings.enable.settings.sync", "Enable Settings Sync")}
                    description={tr("loader.settings.save.your.vencord.settings.to.the.cloud.so.you.can.easily.keep.them.the.same.on.all.your.device", "Save your Vencord settings to the cloud so you can easily keep them the same on all your devices")}
                    value={cloud.settingsSync}
                    onChange={v => { cloud.settingsSync = v; }}
                    disabled={!cloud.authenticated}
                    hideBorder
                />

                <div>
                    <Heading tag="h5">
                        {tr("loader.settings.sync.rules.for.this.device", "Sync Rules for This Device")}</Heading>
                    <Paragraph className={Margins.bottom8}>
                        <LocalizedText id="loader.settings.this.setting.controls.how.settings.move.between.device.and.the.cloud.you.can.let.changes.flow.b" fallback="This setting controls how settings move between {device} and the cloud. You can let changes flow both ways, or choose one place to be the main source of truth." slots={{ device: <strong>{tr("loader.settings.this.device", "this device")}</strong> }} />
                    </Paragraph>
                    <Select
                        options={[
                            {
                                label: tr("loader.settings.two.way.sync.changes.go.both.directions", "Two-way sync (changes go both directions)"),
                                value: "both",
                                default: true,
                            },
                            {
                                label: tr("loader.settings.this.device.is.the.source.upload.only", "This device is the source (upload only)"),
                                value: "push",
                            },
                            {
                                label: tr("loader.settings.the.cloud.is.the.source.download.only", "The cloud is the source (download only)"),
                                value: "pull",
                            },
                            {
                                label: tr("loader.settings.do.not.sync.automatically.manual.sync.via.buttons.below.only", "Do not sync automatically (manual sync via buttons below only)"),
                                value: "manual",
                            }
                        ]}
                        isSelected={v => v === syncDirection}
                        serialize={v => String(v)}
                        select={v => {
                            setCloudSyncDirection(v);
                            setSyncDirection(v);
                        }}
                        closeOnSelect={true}
                    />
                </div>

                <Grid columns={2} gap="1em" className={Margins.top20}>
                    <ButtonWithIcon
                        variant="positive"
                        disabled={!sectionEnabled}
                        onClick={() => putCloudSettings(true)}
                        Icon={CloudUploadIcon}
                    >
                        {tr("loader.settings.upload.settings", "Upload Settings")}</ButtonWithIcon>
                    <Tooltip text={tr("loader.settings.this.will.replace.your.current.settings.with.the.ones.saved.in.the.cloud.be.careful", "This will replace your current settings with the ones saved in the cloud. Be careful!")}>
                        {({ onMouseLeave, onMouseEnter }) => (
                            <ButtonWithIcon
                                variant="dangerPrimary"
                                onMouseLeave={onMouseLeave}
                                onMouseEnter={onMouseEnter}
                                disabled={!sectionEnabled}
                                onClick={() => getCloudSettings(true, true)}
                                Icon={CloudDownloadIcon}
                            >
                                {tr("loader.settings.download.settings", "Download Settings")}</ButtonWithIcon>
                        )}
                    </Tooltip>
                </Grid>
            </Flex>
        </section>
    );
}

function ResetSection() {
    useLocale();
    const { authenticated, settingsSync } = useSettings(["cloud.authenticated", "cloud.settingsSync"]).cloud;

    return (
        <section>
            <SectionHeading text={tr("loader.settings.reset.cloud.data", "Reset Cloud Data")} />

            <Grid columns={2} gap="1em">
                <ButtonWithIcon
                    variant="dangerPrimary"
                    disabled={!authenticated || !settingsSync}
                    onClick={() => deleteCloudSettings()}
                    Icon={DeleteIcon}
                >
                    {tr("loader.settings.delete.settings.from.cloud", "Delete Settings from Cloud")}</ButtonWithIcon>
                <ButtonWithIcon
                    variant="dangerPrimary"
                    disabled={!authenticated}
                    onClick={() => openModal(function LocalizedModal(props) {
                useLocale();
                return (<ConfirmModal
                            {...props}
                            title={tr("loader.settings.are.you.sure", "Are you sure?")}
                            subtitle={tr("loader.settings.once.your.data.is.erased.we.cannot.recover.it.there.s.no.going.back", "Once your data is erased, we cannot recover it. There's no going back!")}
                            onConfirm={eraseAllCloudData}
                            confirmText={tr("loader.settings.erase.it", "Erase it!")}
                            cancelText={tr("loader.settings.nevermind", "Nevermind")}
                        />);
            })}
                    Icon={DeleteIcon}
                >
                    {tr("loader.settings.delete.your.cloud.account", "Delete your Cloud Account")}</ButtonWithIcon>
            </Grid>
        </section>
    );
}

function CloudTab() {
    useLocale();
    return (
        <SettingsTab>
            <Flex flexDirection="column" gap="1em">
                <CloudSetupSection />
                <Divider />
                <SettingsSyncSection />
                <Divider />
                <ResetSection />
            </Flex>
        </SettingsTab>
    );
}

export default wrapTab(CloudTab, "Cloud");
