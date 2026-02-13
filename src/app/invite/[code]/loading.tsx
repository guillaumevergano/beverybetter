import { Spinner } from "@/components/ui/Spinner";

export default function InviteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <Spinner size="lg" />
    </div>
  );
}
