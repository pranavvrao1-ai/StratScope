import { beforeEach, describe, expect, it, vi } from "vitest";

// A fake Supabase client whose auth user and profile role are set per test.
// Any table write is recorded so we can assert unauthorised calls never reach the database.
const state = { user: null as null | { id: string; email: string }, role: "none", writes: [] as string[] };

function fakeClient() {
  const query = (table: string) => {
    const chain: Record<string, unknown> = {};
    const record = (op: string) => () => {
      state.writes.push(`${op}:${table}`);
      return chain;
    };
    Object.assign(chain, {
      select: () => chain,
      eq: () => chain,
      neq: () => chain,
      is: () => chain,
      contains: () => chain,
      limit: () => chain,
      order: () => chain,
      insert: record("insert"),
      update: record("update"),
      delete: record("delete"),
      single: async () => ({ data: { id: "11111111-1111-4111-8111-111111111111" }, error: null }),
      maybeSingle: async () =>
        table === "profiles" && state.user
          ? { data: { id: state.user.id, email: state.user.email, display_name: null, role: state.role }, error: null }
          : { data: { status: "draft" }, error: null },
      then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }),
    });
    return chain;
  };
  return {
    auth: { getUser: async () => ({ data: { user: state.user }, error: state.user ? null : new Error("no session") }) },
    from: query,
  };
}

vi.mock("@/lib/supabase/server", () => ({ serverClient: async () => fakeClient() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

const validArticle = {
  title: "Test",
  slug: "test",
  excerpt: "",
  body: "<p>Hello</p>",
  category: "missile-technology",
  author_id: null,
  author_name: "Pranav V Rao",
  status: "draft" as const,
  featured: false,
  hero_image: "",
  hero_image_alt: "",
  hero_image_credit: "",
  gallery_images: [],
  specifications: [],
  source_references: [],
  tags: [],
  seo_title: "",
  seo_description: "",
  published_date: null,
  scheduled_date: null,
};

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  state.user = null;
  state.role = "none";
  state.writes = [];
});

describe("admin authorisation", () => {
  it("rejects anonymous callers before touching the database", async () => {
    const { saveArticle, deleteArticle } = await import("@/app/actions/admin");
    expect(await saveArticle(null, validArticle)).toEqual({ ok: false, error: "Not authorised" });
    expect(await deleteArticle("11111111-1111-4111-8111-111111111111")).toEqual({ ok: false, error: "Not authorised" });
    expect(state.writes).toEqual([]);
  });

  it("rejects signed-in users without an editorial role", async () => {
    state.user = { id: "22222222-2222-4222-8222-222222222222", email: "reader@example.com" };
    state.role = "none";
    const { saveArticle } = await import("@/app/actions/admin");
    expect(await saveArticle(null, validArticle)).toEqual({ ok: false, error: "Not authorised" });
    expect(state.writes).toEqual([]);
  });

  it("allows editors and validates input", async () => {
    state.user = { id: "33333333-3333-4333-8333-333333333333", email: "editor@example.com" };
    state.role = "editor";
    const { saveArticle } = await import("@/app/actions/admin");
    const bad = await saveArticle(null, { ...validArticle, slug: "Not A Slug!" });
    expect(bad.ok).toBe(false);
    expect(state.writes).toEqual([]);
    const good = await saveArticle(null, validArticle);
    expect(good.ok).toBe(true);
    expect(state.writes).toContain("insert:articles");
  });

  it("only administrators may change roles", async () => {
    state.user = { id: "33333333-3333-4333-8333-333333333333", email: "editor@example.com" };
    state.role = "editor";
    const { setUserRole } = await import("@/app/actions/admin");
    expect(await setUserRole("44444444-4444-4444-8444-444444444444", "admin")).toEqual({
      ok: false,
      error: "Administrator access required",
    });
    expect(state.writes).toEqual([]);
  });

  it("admin pages redirect visitors without a role", async () => {
    const { requireEditorPage } = await import("@/lib/auth");
    await expect(requireEditorPage()).rejects.toThrow("REDIRECT:/login");
    state.user = { id: "22222222-2222-4222-8222-222222222222", email: "reader@example.com" };
    await expect(requireEditorPage()).rejects.toThrow("REDIRECT:/login?error=forbidden");
  });
});
