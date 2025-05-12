import { Message, MessageResponse } from './types';

export const mockMessages: Message[] = [
  {
    id: "MC1028317",
    title: "Microsoft Teams: Enhanced compliance in voicemail messages",
    service: ["Exchange Online", "Microsoft Teams"],
    lastUpdated: "2025-04-09",
    published: "2025-03-11",
    tags: ["Updated message", "Feature update", "User impact", "Admin impact"],
    content: `
      <h2>More information</h2>
      <p>Updated April 9, 2025: We have updated the content. Thank you for your patience.</p>
      <p>We would like to inform you that the rollout of Request for Comments (RFC) compliance enforcement changes, originally announced in January 2025 (MC987329) have been postponed until May 2025.</p>
      <p>With the compliance update in May 2025, the "From" field of voicemail email messages will be modified to meet the latest RFC standard. Specifically, RFC 6854: Update to Internet Message Format to Allow Group Syntax in the "From:" and "Sender:" Header Fields. According to this standard, the Internet message format must always include an address in the "From" header. For example:</p>
      <ul>
        <li>Previously: +44 28 7584 5695 &lt;442875845695&gt;</li>
        <li>After the change: +44 28 7584 5695 &lt;voicemail@tenant.onmicrosoft.com&gt;</li>
      </ul>
      <h2>When this will happen:</h2>
      <p>General Availability (Worldwide, GCC): We will begin rolling out early May 2025 and expect to complete by mid-June 2025.</p>
      <p>General Availability (GCCH, DoD): We will begin rolling out mid-May 2025 and expect to complete by mid-June 2025.</p>
      <h2>How this will affect your organization:</h2>
      <p>Voicemails will be delivered from the email address voicemail@tenant.onmicrosoft.com to meet the latest RFC standard.</p>
      <h2>What you need to do to prepare:</h2>
      <p>Please prepare for the following email address to be the sender of this messages, no later than May 2025: voicemail@tenant.onmicrosoft.com. Starting from May 2025 Voicemails will be delivered from the address voicemail@tenant.onmicrosoft.com.</p>
      <p>If you would like to enable RFC compliance changes earlier than May 2025, please contact us by replying to this message post.</p>
    `
  }
];

export const mockMessageResponse: MessageResponse = {
  messages: mockMessages,
  total: mockMessages.length
}; 