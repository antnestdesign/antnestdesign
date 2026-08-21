import { errorResponse, json, supabaseFetch } from "../_lib/server";

export async function GET() {
  try {
    await supabaseFetch<Array<{ id: string }>>(
      "/rest/v1/cost_items?select=id&limit=1",
    );
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
