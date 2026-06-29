import { AdminShell } from "@/components/AdminShell";
import { comments, posts } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function CommentsPage() {
  const [allComments, allPosts] = await Promise.all([comments(), posts()]);
  const titles = new Map(allPosts.map((post) => [post.id, post.title]));
  return (
    <AdminShell access="write">
      <div className="grid gap-5">
        <h1 className="text-3xl font-semibold">Comments</h1>
        <div className="grid gap-3">
          {allComments.map((comment) => (
            <form key={comment.id} action={`/api/comments/${comment.id}`} method="post" className="panel grid gap-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong>{comment.author_name}</strong>
                  <p className="text-sm text-[#66706a]">{titles.get(comment.post_id)} · {comment.status}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn primary" type="submit" name="status" value="approved">
                    Approve
                  </button>
                  <button className="btn" type="submit" name="status" value="pending">
                    Pending
                  </button>
                  <button className="btn danger" formAction={`/api/comments/${comment.id}/delete`} type="submit">
                    Delete
                  </button>
                </div>
              </div>
              <p>{comment.body}</p>
            </form>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
