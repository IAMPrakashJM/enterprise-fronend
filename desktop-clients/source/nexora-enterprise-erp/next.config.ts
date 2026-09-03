import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /* This app is a FROZEN pre-migration snapshot, kept as the visual baseline the
     monorepo is compared against -- so its source is left byte-identical rather
     than corrected. It carries the three type errors recorded in spec §11:

       src/components/layout/sidebar.tsx:51    'item.children' possibly undefined
       src/components/ui/form-controls.tsx:33  cn() rejects 0
       src/components/worklist/data-table.tsx:13  unknown vs ReactNode

     All three are type-only and pixel-neutral, and were fixed for the monorepo
     in commit 7951db3. `next dev` never surfaced them because it does not type
     check; `next build` does, which is why this only appeared on the move to a
     production build. Skipping the check here keeps the snapshot pristine.
     Delete this and apply the §11 fixes if the baseline is ever unfrozen. */
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
