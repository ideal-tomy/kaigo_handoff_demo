import { MemoApp } from "@/components/MemoApp";
import { DemoIntro } from "@/components/demo-intro/DemoIntro";

type Props = {
  searchParams: Promise<{ embed?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const { embed } = await searchParams;
  if (embed === "intro") {
    return (
      <main className="ki-embed-intro">
        <DemoIntro />
      </main>
    );
  }
  return <MemoApp />;
}
