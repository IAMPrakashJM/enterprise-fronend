import { EnterpriseApp } from "@/components/shared/enterprise-app";
import { ERPProvider } from "@/context/erp-context";

export default function Home() {
  return (
    <ERPProvider>
      <EnterpriseApp />
    </ERPProvider>
  );
}
