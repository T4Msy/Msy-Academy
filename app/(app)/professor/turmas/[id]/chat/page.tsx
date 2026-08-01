import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query/client";
import { createClient } from "@/lib/supabase/server";
import { fetchClassChatPage, fetchClassParticipants } from "@/lib/classes/chat";
import { classChatMessagesQueryKey } from "@/lib/classes/queryKeys";
import { ClassChat } from "@/components/classes/ClassChat";

export const dynamic = "force-dynamic";

export default async function ProfessorTurmaChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: klass } = await supabase.from("classes").select("id, owner_id").eq("id", id).maybeSingle();
  if (!klass || user?.id !== klass.owner_id) notFound();

  const queryClient = getQueryClient();
  const [participants] = await Promise.all([
    fetchClassParticipants(supabase, id),
    queryClient.prefetchQuery({
      queryKey: classChatMessagesQueryKey(id),
      queryFn: () => fetchClassChatPage(supabase, id),
    }),
  ]);

  return (
    <div className="flex min-h-[60vh] flex-col">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClassChat classId={id} currentUserId={user!.id} participants={participants} />
      </HydrationBoundary>
    </div>
  );
}
