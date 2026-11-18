import { puedoPonermeTefilin } from "@/lib/tefilin";

export const dynamic = "force-dynamic";

// GET /api/tefilin            -> "sí" | "no"
// GET /api/tefilin?detalle=1  -> { puedo, respuesta, motivo }
export function GET(req: Request) {
  const r = puedoPonermeTefilin();
  const respuesta = r.puedo ? "sí" : "no";
  if (new URL(req.url).searchParams.has("detalle")) return Response.json({ puedo: r.puedo, respuesta, motivo: r.motivo });
  return new Response(respuesta, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
