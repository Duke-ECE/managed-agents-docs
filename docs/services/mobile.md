# PolyAgent Mobile

The Expo app provides the console on iPhone and Android. Overview is the
first tab. Start a
conversation with the agent picker, or search Sessions by title or ID.
Tool calls and results appear in expandable rows in the chat transcript.
Open Settings to manage your account and choose System, Light, or Dark
appearance.

While an agent replies, the transcript follows the latest text. Scroll
manually to pause following, then tap **Latest messages** to resume.
Swipe right from the left edge to leave a chat or return from a Settings
subpage.

## Preview and sign in

Follow the [mobile repository setup guide](https://github.com/Duke-ECE/managed-agents-mobile#run)
to start an Expo sample preview. A configured build supports email and
password sign-in. Testing GitHub sign-in requires a development build
that registers `managedagents://auth/callback` and the same URL in the
project's allowed redirect list.

Native device acceptance and mobile distribution remain pending. See the
[acceptance checklist](https://github.com/Duke-ECE/managed-agents-mobile/blob/main/doc/ACCEPTANCE.md)
for the device test cases.
