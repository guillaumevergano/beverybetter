import { Spinner } from "@/components/ui/Spinner";

export default function ChapterLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-[#64748b]">Chargement du cours...</p>
    </div>
  );
}
