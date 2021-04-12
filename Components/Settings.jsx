/* WordNotifications, a Powercord plugin that notifies you when someone says specific words
 * Copyright (C) 2021 Vendicated
 *
 * WordNotifications is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * WordNotifications is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with WordNotifications.  If not, see <https://www.gnu.org/licenses/>.
 */

const { SliderInput, TextInput, Category, SwitchItem } = require("powercord/components/settings");
const { React, getModule } = require("powercord/webpack");
const { TOAST_TIMEOUT, HEADER_FORMAT, BODY_FORMAT } = require("../constants");
const Trigger = require("./Trigger");

const { useState, useEffect } = React;
const { getFlattenedGuilds } = getModule(["getFlattenedGuilds"], false);

const guide = `
{CONTENT}         - The message content
{TRIGGERS}        - A comma separated list of triggers found in the message
{TRIGGER_CONTEXT} - All triggers with the preceding and proceeding 5 words, delimited by three periods
{TRIGGER_COUNT}   - Amount of triggers found in the message
{GUILD_ID}        - The id of the server the message came from, or the id of the author if it was a private message
{GUILD_NAME}      - The name of the server the message came from, or the name of the author if it was a private message
{CHANNEL_ID}      - The id of the channel the message came from
{CHANNEL_NAME}    - The name of the channel the message came from
{USER_ID}         - The id of the message author
{USER_NAME}       - The name of the message author
{USER_TAG}        - The full tag of the message author
`;

module.exports = ({ getSetting, updateSetting }) => {
  const [triggers, setTriggers] = useState(getSetting("triggers", []));
  const [hideServersOpened, setHideServersOpened] = useState(false);
  const [ignoresOpened, setIgnoresOpened] = useState(false);
  const [formatOpened, setFormatOpened] = useState(false);
  const [triggersOpened, setTriggersOpened] = useState(false);

  useEffect(() => {
    updateSetting("triggers", triggers);
  }, [triggers]);

  function removeTrigger(idx) {
    const newTriggers = triggers.slice();
    newTriggers.splice(idx, 1);
    setTriggers(newTriggers);
  }

  function addTrigger(str) {
    setTriggers([...triggers, str]);
  }

  function setTrigger(i, str) {
    const newTriggers = triggers.slice();
    newTriggers[i] = str;
    setTriggers(newTriggers);
  }

  function onGuildToggle({ id }) {
    const mutedGuilds = getSetting("mutedGuilds", []);

    if (!mutedGuilds.includes(id)) {
      updateSetting("mutedGuilds", [...mutedGuilds, id]);
    } else {
      updateSetting(
        "mutedGuilds",
        mutedGuilds.filter(g => g !== id)
      );
    }
  }

  return (
    <div>
      <Category name="Triggers" description="Here you can manage your triggers" opened={triggersOpened} onChange={() => setTriggersOpened(!triggersOpened)}>
        {triggers.map((t, i) => (
          <Trigger key={t} value={t} pos={i} setTrigger={setTrigger} removeTrigger={removeTrigger} triggers={triggers} />
        ))}

        <Trigger pos={-1} value="" addTrigger={addTrigger} triggers={triggers} />
      </Category>

      <Category
        name="Toast Format"
        description="Here you can customise the toast that is shown if a trigger is detected"
        opened={formatOpened}
        onChange={() => setFormatOpened(!formatOpened)}
      >
        <SliderInput
          stickToMarkers
          required
          className="venTriggersToastTimeout"
          minValue={1}
          maxValue={10}
          defaultValue={TOAST_TIMEOUT}
          initialValue={getSetting("toastTimeout", TOAST_TIMEOUT)}
          markers={[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 10]}
          onValueChange={v => updateSetting("toastTimeout", v)}
        >
          The toast timeout, in seconds
        </SliderInput>
        <TextInput value={getSetting("headerFormat", HEADER_FORMAT)} onChange={v => updateSetting("headerFormat", v)}>
          The toast header format
        </TextInput>
        <TextInput value={getSetting("bodyFormat", BODY_FORMAT)} onChange={v => updateSetting("bodyFormat", v)}>
          The toast body format
        </TextInput>

        <p className="venTriggersFormatGuideTitle">The following variables can be used in the above two formats and will be replaced accordingly:</p>
        <p className="venTriggersFormatGuide">
          {guide.split("\n").map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </p>
      </Category>

      <Category
        name="Overrides and Ignores"
        description="Specify overrides and ignores"
        opened={ignoresOpened}
        onChange={() => setIgnoresOpened(!ignoresOpened)}
      >
        <SwitchItem note="Whether own messages should be ignored" value={getSetting("ignoreSelf", true)} onChange={v => updateSetting("ignoreSelf", v)}>
          Ignore self. Highly recommended
        </SwitchItem>
        <SwitchItem note="Whether all muted servers should be ignored" value={getSetting("ignoreMuted", true)} onChange={v => updateSetting("ignoreMuted", v)}>
          Ignore all muted servers
        </SwitchItem>

        <SwitchItem
          note="Whether all friends should always alert you regardless of your server mutes"
          value={getSetting("whitelistFriends", true)}
          onChange={v => updateSetting("whitelistFriends", v)}
        >
          Whitelist all friends
        </SwitchItem>
      </Category>

      {!getSetting("ignoreMuted", true) && (
        <Category
          name="Ignore specific Servers"
          description="Ignore messages from specific servers. They won't alert you any more"
          opened={hideServersOpened}
          onChange={() => setHideServersOpened(!hideServersOpened)}
        >
          {getFlattenedGuilds().map(g => (
            <SwitchItem key={g.id} value={getSetting("mutedGuilds", []).includes(g.id)} onChange={() => onGuildToggle(g)}>
              Mute messages from {g.name}
            </SwitchItem>
          ))}
        </Category>
      )}
    </div>
  );
};
