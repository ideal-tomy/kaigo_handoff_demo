"use client";

import { SAMPLES } from "@/lib/samples";

type Props = {
  disabled?: boolean;
  onSelect: (sampleId: string) => void;
};

export function SampleLauncher({ disabled, onSelect }: Props) {
  return (
    <div className="sampleLauncher">
      <div className="sampleLauncherHeader">
        <strong>サンプルで試す（推奨）</strong>
        <span>APIキー不要。商談の主導線はこちら</span>
      </div>
      <div className="sampleButtons">
        {SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            className="sampleBtn"
            disabled={disabled}
            onClick={() => onSelect(sample.id)}
          >
            <div className="sampleBtnTitle">{sample.label}</div>
            <div className="sampleBtnDesc">{sample.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
