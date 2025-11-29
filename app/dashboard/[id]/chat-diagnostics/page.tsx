import { ChatDiagnostics } from "@/components/chat/chat-diagnostics";

export default async function DiagnosticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="container py-10">
      <ChatDiagnostics farewellId={id} />
    </div>
  );
}
