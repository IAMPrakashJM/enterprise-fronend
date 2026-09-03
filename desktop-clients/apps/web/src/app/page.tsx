import { LandingRedirect } from "@/platform/landing-redirect";

/* Formerly a server redirect to /finance/finance-dashboard. The landing is now
   a preference, and preferences are client state behind the sign-in gate -- so
   the decision has to be made in the browser, after ERPProvider has loaded them.
   The cost is one client-side hop instead of a server 307; the gate would have
   shown a splash on "/" either way. */
export default function Home() {
  return <LandingRedirect />;
}
