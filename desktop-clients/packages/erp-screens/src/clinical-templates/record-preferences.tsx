"use client";
import React from "react";
import { Button, useLocalization } from "@pepbits/ops-ui";
import { useERP } from "@pepbits/erp-shell";
import { THEME_OPTIONS } from "@pepbits/erp-config";
import {
  Rows3,
  PanelsTopLeft,
  ListOrdered,
  SlidersHorizontal,
} from "lucide-react";
export function RecordPreferenceControls() {
  const { preferences, updatePreference, preferencePolicy } = useERP(),
    { t } = useLocalization();
  return (
    <div className="flex flex-wrap items-center gap-3" data-record-preferences>
      <div className="flex gap-1" role="group" aria-label={t("Theme")}>
        {THEME_OPTIONS.slice(0, 5).map((theme) => (
          <Button
            key={theme.id}
            size="xs"
            variant="ghost"
            aria-label={t(theme.name)}
            title={t(theme.name)}
            aria-pressed={preferences.theme === theme.id}
            disabled={preferencePolicy.rules.theme?.locked}
            onClick={() => updatePreference("theme", theme.id)}
            style={{
              padding: 2,
              width: 22,
              height: 22,
              borderRadius: "50%",
              border:
                preferences.theme === theme.id
                  ? "2px solid var(--primary)"
                  : "2px solid transparent",
            }}
          >
            <span
              style={{
                background: theme.swatches[0],
                width: 14,
                height: 14,
                borderRadius: "50%",
              }}
            />
          </Button>
        ))}
      </div>
      <div
        className="flex rounded-lg border border-[var(--border)]"
        role="group"
        aria-label={t("Layout")}
      >
        {(["rail", "tabs", "wizard"] as const).map((layout, i) => {
          const Icon = [Rows3, PanelsTopLeft, ListOrdered][i];
          return (
            <Button
              key={layout}
              size="sm"
              variant={
                preferences.formNavigation === layout ? "primary" : "ghost"
              }
              aria-label={t(`template.clinical.layout${layout}`)}
              aria-pressed={preferences.formNavigation === layout}
              disabled={preferencePolicy.rules.formNavigation?.locked}
              onClick={() => updatePreference("formNavigation", layout)}
            >
              <Icon size={15} />
            </Button>
          );
        })}
      </div>
      <Button
        size="sm"
        variant="ghost"
        disabled={preferencePolicy.rules.density?.locked}
        onClick={() =>
          updatePreference(
            "density",
            preferences.density === "compact" ? "comfortable" : "compact",
          )
        }
      >
        <SlidersHorizontal size={15} />
        {t(preferences.density === "compact" ? "Compact" : "Comfortable")}
      </Button>
    </div>
  );
}
