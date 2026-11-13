'use client';

import { useMemo, useState } from 'react';
import { copyRichHtml } from '@/lib/clipboard';
import { buildEmailHtml, buildEmailText } from '@/lib/briefing/email';
import {
  buildEmailModel,
  defaultDraft,
  getBriefingArea,
  type BriefingDraft,
  type BriefingModel,
} from '@/lib/briefing/model';
import type { ReleasePlanResult } from '@/lib/briefing/release-plan';

interface BriefingEditorProps {
  model: BriefingModel;
  releasePlan: ReleasePlanResult | null;
}

type CopyStatus = { kind: 'idle' } | { kind: 'success' | 'error'; message: string };

const FIELD_CLASS =
  'type-body-sm mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const BUTTON_CLASS =
  'type-body-sm inline-flex min-h-9 items-center rounded-lg border border-line-strong bg-surface px-4 font-medium text-ink hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function BriefingEditor({ model, releasePlan }: BriefingEditorProps) {
  const [draft, setDraft] = useState<BriefingDraft>(() => defaultDraft(model));
  const [status, setStatus] = useState<CopyStatus>({ kind: 'idle' });

  const email = useMemo(
    () => buildEmailModel(model, draft, releasePlan ?? undefined),
    [model, draft, releasePlan]
  );
  // Every value in the generated HTML is escaped and links are https-only, so
  // it is safe to render as the preview.
  const html = useMemo(() => buildEmailHtml(email), [email]);
  const text = useMemo(() => buildEmailText(email), [email]);

  function updateDraft(patch: Partial<BriefingDraft>) {
    setDraft(current => ({ ...current, ...patch }));
    setStatus({ kind: 'idle' });
  }

  function toggleItem(key: string, isIncluded: boolean) {
    updateDraft({
      excludedKeys: isIncluded
        ? draft.excludedKeys.filter(candidate => candidate !== key)
        : [...draft.excludedKeys, key],
    });
  }

  function setSummary(key: string, summary: string) {
    updateDraft({ summaryOverrides: { ...draft.summaryOverrides, [key]: summary } });
  }

  async function copyForOutlook() {
    try {
      await copyRichHtml(html, text);
      setStatus({ kind: 'success', message: 'Copied. Paste into a new Outlook message.' });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Copy failed.',
      });
    }
  }

  async function copyPlainText() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus({ kind: 'success', message: 'Plain text copied.' });
    } catch {
      setStatus({ kind: 'error', message: 'Plain-text copy is not available in this browser.' });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <section aria-labelledby="draft-heading" className="space-y-5">
        <h2 id="draft-heading" className="type-h3 text-ink">
          Draft
        </h2>

        <label className="type-body-sm block font-medium text-ink">
          Greeting
          <input
            className={FIELD_CLASS}
            value={draft.greeting}
            onChange={event => updateDraft({ greeting: event.target.value })}
          />
        </label>
        <label className="type-body-sm block font-medium text-ink">
          Introduction
          <textarea
            className={FIELD_CLASS}
            rows={5}
            value={draft.intro}
            onChange={event => updateDraft({ intro: event.target.value })}
          />
        </label>
        <label className="type-body-sm block font-medium text-ink">
          Closing
          <textarea
            className={FIELD_CLASS}
            rows={2}
            value={draft.closing}
            onChange={event => updateDraft({ closing: event.target.value })}
          />
        </label>

        <fieldset>
          <legend className="type-body-sm font-medium text-ink">
            Items ({model.items.length - draft.excludedKeys.length} of {model.items.length}{' '}
            included)
          </legend>
          {model.items.length === 0 ? (
            <p className="type-body-sm mt-2 text-ink-muted">
              No matching Message Center posts for this week.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
              {model.items.map(item => {
                const isIncluded = !draft.excludedKeys.includes(item.key);
                return (
                  <li key={item.key} className="p-3">
                    <label className="type-body-sm flex items-start gap-2 text-ink">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={isIncluded}
                        onChange={event => toggleItem(item.key, event.target.checked)}
                      />
                      <span>
                        {item.isAction ? (
                          <span className="mr-1 font-semibold text-warn-ink">Action needed ·</span>
                        ) : null}
                        {item.cleanTitle}
                        <span className="type-meta block text-ink-subtle">
                          {item.id} · {getBriefingArea(item.area).label}
                        </span>
                      </span>
                    </label>
                    {isIncluded ? (
                      <label className="type-meta mt-2 block text-ink-muted">
                        Summary
                        <textarea
                          className={FIELD_CLASS}
                          rows={3}
                          value={draft.summaryOverrides[item.key] ?? item.summary}
                          onChange={event => setSummary(item.key, event.target.value)}
                        />
                      </label>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>

        <button
          type="button"
          className={BUTTON_CLASS}
          onClick={() => {
            setDraft(defaultDraft(model));
            setStatus({ kind: 'idle' });
          }}
        >
          Reset draft
        </button>
      </section>

      <section aria-labelledby="preview-heading" className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="preview-heading" className="type-h3 mr-auto text-ink">
            Email preview
          </h2>
          <button
            type="button"
            onClick={copyForOutlook}
            className="type-body-sm inline-flex min-h-9 items-center rounded-lg bg-accent px-4 font-medium text-white hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Copy for Outlook
          </button>
          <button type="button" onClick={copyPlainText} className={BUTTON_CLASS}>
            Copy plain text
          </button>
        </div>
        <p
          role="status"
          aria-live="polite"
          className={`type-meta mt-2 min-h-5 ${status.kind === 'error' ? 'text-critical-ink' : 'text-ink-muted'}`}
        >
          {status.kind === 'idle' ? '' : status.message}
        </p>
        <div
          className="mt-2 overflow-x-auto rounded-xl border border-line bg-white p-2"
          data-testid="briefing-preview"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </section>
    </div>
  );
}
