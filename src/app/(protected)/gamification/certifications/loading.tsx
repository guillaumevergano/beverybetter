import { Spinner } from "@/components/ui/Spinner";

export default function CertificationsLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  );
}
