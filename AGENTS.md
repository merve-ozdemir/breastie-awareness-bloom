<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Keep screen navigation in the shared Flow header, including Welcome, so all screens use the same navigation controls.
- All UI text and spoken prompts come from `src/i18n/{lang}.json`; extraction synonym hints live in `src/data/synonyms/{lang}.json`, so translations and everyday vocabulary remain language-file driven.
- The app has no spoken prompts or voiceovers; the only sounds are the short record start/stop cues (`softCue`). The user speaks once, the AI fills the form, and the user reviews and confirms each finding by tapping.
- Every entry passes `validateEntry` in `src/lib/schema.ts`; disallowed values move to the note, keeping the record schema-safe whatever produced it.
- Full-exam speech/text extraction goes through `processExam`; Demo uses dictionary hints locally, real audio uses the TanStack process-exam upload endpoint, keeping extraction replaceable.
- Placeholder icons live only in `src/components/icons.tsx` (`ICONS` map) so they can be swapped for tested illustrations.
- Check data stays on-device in IndexedDB and is written only on Confirm; Cloud processes audio transiently and keeps only private synthesized audio cache and service access-state metadata, with no accounts.
- Location-unclear findings retain their raw changes until the user assigns a region, then pass region-specific validation; this avoids guessed locations and discarded symptoms.
- "Left/right side" of a breast is resolved relative to that breast (same side as the breast = outer), using side words adjacent to a breast word from the synonyms file as the breast marker; this lets first-person phrasing map to quadrants without guessing.
