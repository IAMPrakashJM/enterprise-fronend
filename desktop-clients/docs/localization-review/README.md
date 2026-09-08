# Native-speaker review — pending

No native-speaker approval has been recorded. Automated checks and AI-authored
translations are not a substitute for that review.

Each language has a UTF-8 CSV review sheet with the message key, English source,
current translation, reviewer, status, proposed translation and notes. Open it
in Excel using UTF-8. Assign an Arabic, Hindi or Malayalam native speaker to the
matching file. Clinical and accounting terms should also be checked by someone
familiar with the relevant domain.

1. Read the English source and translation in the context of the application.
2. Check meaning, grammar, terminology, punctuation and short-button readability.
3. Preserve placeholders such as `{stage}`, `{count}` and `{detail}` exactly.
4. Record the reviewer's name and mark each row Approved or Changes requested.
5. Put corrections in proposed_translation. Do not change business data or IDs.
6. Apply accepted corrections to the canonical JSON catalogs, run
   `npm run localization:sync` and `npm run verify:localization`, then repeat the
   affected browser checks.

The invoice PDFs and customer Excel workbooks are generated test artifacts from
isolated demo data. They provide context for RTL layout, native headings and
numeric formatting. The PDFs use browser print-to-PDF; they do not demonstrate
a background PDF service. Account number formatting in these examples is German,
and invoice currency remains AED.

The CSV sheets cover 2979 distinct shared messages, including navigation,
schema, UI and API copy. Product overrides remain in
`dummy-api/config/localization/products/`; review them in their product context
before signing off an entire product. Reviewed technical/data exceptions are
excluded from the wording sheets.
