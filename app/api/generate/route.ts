import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { parseTranscriptToDrafts } from "@/lib/parseTranscript";

const bodySchema = z.object({
  transcript: z.string().min(1).max(4000),
});

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  let transcript: string;

  try {
    const json = await request.json();
    transcript = bodySchema.parse(json).transcript;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!apiKey) {
    const parsed = parseTranscriptToDrafts(transcript);
    return NextResponse.json({
      handoff: parsed.handoff,
      progress: parsed.progress,
      scenarioId: parsed.matchedScenarioId,
      mode: "client-fallback",
    });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `介護施設の音声メモを申し送り票(handoff)と経過記録(progress)に整理する。
JSON形式: { "handoff": { "resident", "unit", "shiftFrom", "shiftTo", "priority", "fields": [{ "key", "label", "value", "needsReview?", "correctValue?", "priority?" }] }, "progress": { "resident", "date", "fields": [...] } }
priorityは normal|attention|urgent。要確認項目には needsReview:true と correctValue を付ける。`,
        },
        { role: "user", content: transcript },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("empty response");

    const parsed = JSON.parse(content) as {
      handoff: ReturnType<typeof parseTranscriptToDrafts>["handoff"];
      progress: ReturnType<typeof parseTranscriptToDrafts>["progress"];
    };

    return NextResponse.json({ ...parsed, mode: "openai" });
  } catch {
    const parsed = parseTranscriptToDrafts(transcript);
    return NextResponse.json({
      handoff: parsed.handoff,
      progress: parsed.progress,
      scenarioId: parsed.matchedScenarioId,
      mode: "fallback",
    });
  }
}
