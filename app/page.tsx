import { MemoApp } from "@/components/MemoApp";
import { DemoIntro } from "@/components/demo-intro/DemoIntro";

type Props = {
  searchParams: Promise<{ embed?: string; view?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const { embed, view } = await searchParams;
  if (embed === "intro") {
    return (
      <main className={`ki-embed-intro${view === "stage" ? " ki-embed-stage" : ""}`}>
        <DemoIntro />
      </main>
    );
  }
  return <MemoApp />;
}
