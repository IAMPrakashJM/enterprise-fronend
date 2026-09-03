# Vantage ERP (Next.js 15 · TypeScript · Tailwind 4)

Schema-driven, preference-driven enterprise ERP shell. Only the data layer is mocked (lib/mock).

## Run
npm install      # postinstall renames app/-shell-, -module-, -entity-, -id- to (shell), [module], [entity], [id]
                 # (zip archives cannot carry those characters). Run "npm run setup" manually if needed.
npm run dev      # http://localhost:3000 → redirects to /sales

## Structure
app/(shell)/[module]                 dashboard per module
app/(shell)/[module]/[entity]        worklist (search · basic + advanced filters · table/cards · paging · columns · CSV)
app/(shell)/[module]/[entity]/[id]   record form (rail | tabs | wizard from preferences; id "new" creates)
app/(shell)/[module]/billing         tax invoice transaction
app/(shell)/[module]/reports         report center (run · schedule to email)
app/(shell)/[module]/excel           spreadsheet utility (formulas · CSV import/export)
app/(shell)/preferences|settings|profile
app/(shell)/library/[section]        component & developer documentation
components/primitives                Button Input Select MultiSelect Toggle Textarea Kbd StatusPill
components/navigation                Header Sidebar TabStrip Footer CommandPalette
components/surfaces                  Surface(card|modal|panel) Toaster ConfirmDialog
components/data                      FilterBar DataTable CardGrid Pager ColumnChooser QuickView
components/forms                     RecordForm FieldRenderer (Rail/Tabs/Wizard layouts)
components/patterns                  Dashboard Worklist Transaction ReportCenter SheetUtility Preferences Library
components/help                      HelpPanel (guided tour · docs · shortcuts)
lib/prefs                            zod schema + zustand store (persisted) + applyPrefs → CSS variables
lib/themes                           8 themes as token objects
lib/i18n                             en · ar (RTL) · hi · es · zh
lib/mock                             entity schemas, menu trees, dashboards, reports, generated rows

## Design rules
* Components never use literal colors/sizes: Tailwind utilities map to CSS variables written by applyPrefs().
* A page is one line: <Worklist schema={schemas[entity]} />. Removing a field from a schema removes it everywhere.
* Every layout choice (form shell, result view, quick view placement, toast anchor, sidebar side, language) is a preference.
