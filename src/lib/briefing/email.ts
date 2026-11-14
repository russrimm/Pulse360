/**
 * Outlook-safe HTML and plain-text renderers for the Weekly Customer Briefing.
 *
 * Outlook's compose surface strips <style> blocks, classes, and CSS variables
 * and often drops font styling from everything but table cells, so every
 * element carries inline styles, layout uses tables, each block of text is its
 * own row, and light backgrounds carry dark text. Every dynamic value goes
 * through `esc`, and only absolute https links survive into the email.
 *
 * Adapted from the MicrosoftCommunicationsPortal sample (MIT, © 2025 Microsoft
 * Corporation).
 */

import type { EmailGroup, EmailItem, EmailModel } from './model';

const FONT = "'Segoe UI',Aptos,Calibri,Arial,sans-serif";
const COLOR = {
  text: '#1f2937',
  strong: '#111827',
  muted: '#4b5563',
  soft: '#6b7280',
  border: '#e5e7eb',
  link: '#0f6cbd',
  headerBg: '#dbe8f8',
  headerBar: '#0f3d7a',
  headerText: '#0b2a55',
  headerSub: '#2f4a73',
  accent: '#6d28d9',
  actionBg: '#fff7ed',
  actionBar: '#c2410c',
  actionText: '#9a3412',
  statBg: '#f8fafc',
};
const BASE = `font-family:${FONT};mso-line-height-rule:exactly;`;
const TABLE = 'role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"';

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only absolute https links are allowed in the email. */
export function safeEmailUrl(value: string | null | undefined): string {
  const url = String(value ?? '').trim();
  if (/[\u0000-\u001f\s]/.test(url)) return '';
  return /^https:\/\//i.test(url) ? url : '';
}

function link(href: string, label: string, extraStyle = ''): string {
  const safe = safeEmailUrl(href);
  if (!safe) return esc(label);
  return `<a href="${esc(safe)}" target="_blank" rel="noopener noreferrer" style="color:${COLOR.link};text-decoration:underline;${extraStyle}">${esc(label)}</a>`;
}

function fontColor(css: string, inner: string): string {
  const matches = css.match(/(?:^|;)\s*color:\s*(#[0-9a-f]{3,6})/gi);
  if (!matches) return inner;
  const hex = /#[0-9a-f]{3,6}/i.exec(matches[matches.length - 1])?.[0];
  return hex ? `<font color="${hex}">${inner}</font>` : inner;
}

/** One row of text: styles live on the cell, color is repeated in <font>. */
function row(css: string, inner: string, attributes = ''): string {
  return `<tr><td${attributes} style="${BASE}${css}">${fontColor(css, inner)}</td></tr>`;
}

function wrap(block: string, css = 'padding:0;'): string {
  return `<tr><td style="${BASE}${css}">${block}</td></tr>`;
}

function table(rows: string, extra = ''): string {
  return `<table ${TABLE} style="border-collapse:collapse;${extra}">${rows}</table>`;
}

function chip(label: string, background: string, foreground: string): string {
  return (
    `<td align="center" nowrap="nowrap" bgcolor="${background}" style="${BASE}background-color:${background};color:${foreground};font-size:11px;font-weight:600;line-height:16px;padding:1px 8px;white-space:nowrap;">` +
    `${fontColor(`color:${foreground}`, esc(label))}</td>` +
    '<td width="4" style="width:4px;font-size:0;line-height:0;">&nbsp;</td>'
  );
}

function chipRow(cells: string): string {
  return cells
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;"><tr>${cells}</tr></table>`
    : '';
}

function itemChips(item: EmailItem): string {
  let cells = '';
  if (item.isMajor) cells += chip('Major', '#fee2e2', '#991b1b');
  if (item.isUpdated) cells += chip('Updated', '#fef3c7', '#92400e');
  for (const date of item.keyDates) {
    const urgent = date.label === 'Act by' || date.label === 'Retires';
    cells += urgent
      ? chip(`${date.label} ${date.dateLabel}`, '#fee2e2', '#991b1b')
      : chip(`${date.label} ${date.dateLabel}`, '#e0f2fe', '#075985');
  }
  cells += chip(item.id, '#f3f4f6', '#4b5563');
  if (safeEmailUrl(item.learnUrl)) {
    cells += `<td nowrap="nowrap" style="${BASE}font-size:12px;padding-left:4px;">${link(item.learnUrl, 'Learn more', 'font-size:12px;')}</td>`;
  }
  return chipRow(cells);
}

function paragraph(html: string, style = ''): string {
  return row(`padding:0 0 10px;font-size:14px;line-height:22px;color:${COLOR.text};${style}`, html);
}

function sectionHeading(title: string, note = ''): string {
  const edge = `border-bottom:2px solid ${COLOR.border};padding:24px 0 6px;`;
  return (
    wrap(
      table(
        `<tr><td nowrap="nowrap" style="${BASE}${edge}font-size:17px;font-weight:700;color:${COLOR.strong};">${fontColor(`color:${COLOR.strong}`, esc(title))}</td>` +
          `<td width="100%" style="${BASE}${edge}padding-left:10px;font-size:12px;color:${COLOR.soft};">${
            note ? fontColor(`color:${COLOR.soft}`, esc(note)) : '&nbsp;'
          }</td></tr>`
      )
    ) + '<tr><td height="8" style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>'
  );
}

function renderHeader(email: EmailModel): string {
  return table(
    `<tr><td height="6" bgcolor="${COLOR.headerBar}" style="background-color:${COLOR.headerBar};height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>` +
      `<tr><td bgcolor="${COLOR.headerBg}" style="background-color:${COLOR.headerBg};padding:20px 24px 18px;font-family:${FONT};">` +
      table(
        row(
          `font-size:12px;font-weight:600;color:${COLOR.headerSub};`,
          esc(email.dateLabel.toUpperCase())
        ) +
          row(
            `font-size:24px;font-weight:700;line-height:30px;color:${COLOR.headerText};padding-top:4px;`,
            esc(email.headline)
          ) +
          row(`font-size:12px;color:${COLOR.headerSub};padding-top:6px;`, esc(email.coverageLabel))
      ) +
      '</td></tr>' +
      `<tr><td height="4" bgcolor="${COLOR.accent}" style="background-color:${COLOR.accent};height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>`
  );
}

function renderIntro(email: EmailModel): string {
  let rows = '';
  if (email.greeting.trim()) {
    rows += paragraph(`<strong>${esc(email.greeting.trim())}</strong>`, 'padding-top:18px;');
  }
  for (const paragraphText of email.intro.split(/\n{2,}/)) {
    if (paragraphText.trim()) {
      rows += paragraph(esc(paragraphText.trim()).replace(/\n/g, '<br>'));
    }
  }
  const cells = email.stats
    .map(
      (stat, index) =>
        (index ? '<td width="8" style="width:8px;font-size:0;">&nbsp;</td>' : '') +
        `<td align="center" valign="top" bgcolor="${COLOR.statBg}" style="background-color:${COLOR.statBg};border:1px solid ${COLOR.border};padding:10px 6px;font-family:${FONT};">` +
        table(
          row(
            `text-align:center;font-size:22px;font-weight:700;line-height:26px;color:${COLOR.strong};`,
            esc(stat.value),
            ' align="center"'
          ) +
            row(
              `text-align:center;font-size:11px;color:${COLOR.muted};padding-top:3px;`,
              esc(stat.label),
              ' align="center"'
            )
        ) +
        '</td>'
    )
    .join('');
  rows += wrap(
    `<table ${TABLE} style="border-collapse:separate;"><tr>${cells}</tr></table>`,
    'padding:4px 0 0;'
  );
  return rows;
}

function renderActions(actions: EmailItem[]): string {
  if (!actions.length) return '';
  const rows = actions
    .map((item, index) => {
      const label = `${item.reasonLabel || 'Prepare now'} · ${item.areaLabel}`;
      return wrap(
        table(
          row(
            `font-size:11px;font-weight:700;color:${COLOR.actionText};`,
            esc(label.toUpperCase())
          ) +
            row(
              `font-size:15px;font-weight:700;line-height:20px;color:${COLOR.strong};padding:2px 0 4px;`,
              link(item.href, item.title, `color:${COLOR.strong};`)
            ) +
            wrap(itemChips(item), 'padding:0 0 4px;') +
            row(
              `font-size:13px;line-height:20px;color:${COLOR.text};`,
              item.actionText
                ? `<strong>What to do:</strong> ${esc(item.actionText)}`
                : esc(item.summary)
            )
        ),
        `padding:${index ? '10px' : '0'} 0 2px;${index ? 'border-top:1px solid #fed7aa;' : ''}`
      );
    })
    .join('');
  const callout = table(
    `<tr><td width="4" bgcolor="${COLOR.actionBar}" style="background-color:${COLOR.actionBar};width:4px;font-size:0;line-height:0;">&nbsp;</td>` +
      `<td bgcolor="${COLOR.actionBg}" style="background-color:${COLOR.actionBg};padding:12px 16px;font-family:${FONT};">${table(rows)}</td></tr>`
  );
  return (
    sectionHeading(
      'Action required & upcoming retirements',
      `${actions.length} ${actions.length === 1 ? 'item' : 'items'}`
    ) + wrap(callout)
  );
}

function renderGroups(groups: EmailGroup[]): string {
  let html = '';
  for (const group of groups) {
    html += row(
      `font-size:13px;font-weight:700;color:${group.color};padding:12px 0 4px;`,
      esc(group.label)
    );
    const items = group.items
      .map(
        item =>
          `<tr><td width="3" bgcolor="${group.color}" style="background-color:${group.color};width:3px;font-size:0;line-height:0;">&nbsp;</td>` +
          `<td style="${BASE}padding:7px 0 8px 12px;border-bottom:1px solid ${COLOR.border};">` +
          table(
            row(
              `font-size:14px;font-weight:600;line-height:20px;color:${COLOR.strong};`,
              link(item.href, item.title, `color:${COLOR.strong};text-decoration:none;`)
            ) +
              (item.summary
                ? row(
                    `font-size:13px;line-height:19px;color:${COLOR.muted};padding:1px 0 4px;`,
                    esc(item.summary)
                  )
                : '') +
              wrap(itemChips(item))
          ) +
          '</td></tr>'
      )
      .join('');
    html += wrap(table(items));
  }
  return html;
}

function renderMessages(email: EmailModel): string {
  if (!email.groups.length) {
    return email.actions.length || !email.emptyNote
      ? ''
      : sectionHeading('New in Message Center') +
          paragraph(esc(email.emptyNote), `color:${COLOR.muted};`);
  }
  return sectionHeading('New in Message Center') + renderGroups(email.groups);
}

function renderReleasePlan(email: EmailModel): string {
  const plan = email.releasePlan;
  if (!plan) return '';
  const heading = sectionHeading('Coming soon', plan.isUnavailable ? '' : plan.note);
  if (plan.isUnavailable) {
    return heading + paragraph(esc(plan.note), `color:${COLOR.muted};`);
  }
  if (!plan.features.length) {
    return (
      heading +
      paragraph('No tracked features reach preview or GA in this period.', `color:${COLOR.muted};`)
    );
  }
  const rows = plan.features
    .map(
      feature =>
        '<tr>' +
        `<td valign="top" style="${BASE}padding:5px 10px 5px 0;border-bottom:1px solid ${COLOR.border};font-size:13px;line-height:19px;color:${COLOR.text};">${fontColor(
          `color:${COLOR.text}`,
          `<strong>${esc(feature.name)}</strong><br>${esc(feature.product)}`
        )}</td>` +
        `<td valign="top" nowrap="nowrap" style="${BASE}padding:5px 0;border-bottom:1px solid ${COLOR.border};font-size:13px;color:${COLOR.text};white-space:nowrap;">${fontColor(
          `color:${COLOR.text}`,
          esc(feature.phaseLabel)
        )}</td></tr>`
    )
    .join('');
  return heading + wrap(table(rows));
}

function renderSignOff(email: EmailModel): string {
  let rows = '';
  if (email.closing.trim()) {
    rows += paragraph(esc(email.closing.trim()).replace(/\n/g, '<br>'), 'padding-top:20px;');
  }
  if (email.footerNote) {
    rows += paragraph(
      esc(email.footerNote),
      `font-size:11px;color:${COLOR.soft};padding-top:16px;`
    );
  }
  return rows;
}

export function buildEmailHtml(email: EmailModel): string {
  const body =
    renderIntro(email) +
    renderActions(email.actions) +
    renderMessages(email) +
    renderReleasePlan(email) +
    renderSignOff(email);
  return (
    `<table ${TABLE} bgcolor="#ffffff" style="border-collapse:collapse;background-color:#ffffff;">` +
    '<tr><td align="center" style="padding:0;">' +
    `<table ${TABLE} style="border-collapse:collapse;width:100%;background-color:#ffffff;">` +
    `<tr><td style="padding:0;">${renderHeader(email)}</td></tr>` +
    `<tr><td style="padding:0 24px 24px;font-family:${FONT};color:${COLOR.text};">${table(body)}</td></tr>` +
    '</table></td></tr></table>'
  );
}

export function buildEmailText(email: EmailModel): string {
  const out: string[] = [];
  const heading = (title: string) => out.push('', title.toUpperCase(), '-'.repeat(title.length));
  const dates = (item: EmailItem) =>
    item.keyDates.map(date => `${date.label} ${date.dateLabel}`).join('; ');

  out.push(`${email.headline} — ${email.dateLabel}`, email.coverageLabel, '');
  if (email.greeting.trim()) out.push(email.greeting.trim(), '');
  if (email.intro.trim()) out.push(email.intro.trim());
  out.push('', email.stats.map(stat => `${stat.value} ${stat.label}`).join(' | '));

  if (email.actions.length) {
    heading('Action required & upcoming retirements');
    for (const item of email.actions) {
      out.push(`* ${item.title} (${item.id})${dates(item) ? ` [${dates(item)}]` : ''}`);
      out.push(`  ${item.actionText ? `What to do: ${item.actionText}` : item.summary}`);
      if (safeEmailUrl(item.href)) out.push(`  ${item.href}`);
    }
  }
  if (email.groups.length) {
    heading('New in Message Center');
    for (const group of email.groups) {
      out.push('', group.label);
      for (const item of group.items) {
        out.push(`* ${item.title} (${item.id})${dates(item) ? ` [${dates(item)}]` : ''}`);
        if (item.summary) out.push(`  ${item.summary}`);
      }
    }
  } else if (!email.actions.length && email.emptyNote) {
    heading('New in Message Center');
    out.push(email.emptyNote);
  }
  if (email.releasePlan) {
    heading('Coming soon');
    if (email.releasePlan.isUnavailable) {
      out.push(email.releasePlan.note);
    } else if (!email.releasePlan.features.length) {
      out.push('No tracked features reach preview or GA in this period.');
    } else {
      for (const feature of email.releasePlan.features) {
        out.push(`* ${feature.name} (${feature.product}) — ${feature.phaseLabel}`);
      }
    }
  }
  out.push('');
  if (email.closing.trim()) out.push(email.closing.trim(), '');
  if (email.footerNote) out.push(email.footerNote);
  return `${out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()}\n`;
}
