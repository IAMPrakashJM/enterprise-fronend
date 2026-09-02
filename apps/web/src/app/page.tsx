import { redirect } from "next/navigation";

/* The persisted module lives in localStorage, which the server cannot read, so the
   canonical landing is the default module. Redirecting again on the client would
   flash, and the module switcher is one click away. */
export default function Home() {
  redirect("/finance/finance-dashboard");
}
