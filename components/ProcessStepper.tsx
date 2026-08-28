type Step = 1 | 2 | 3 | 4;

type Props = {
  step: Step;
};

const STEPS = [
  { num: 1, label: "入力" },
  { num: 2, label: "書き起こし" },
  { num: 3, label: "下書き確認" },
  { num: 4, label: "提出" },
] as const;

export function ProcessStepper({ step }: Props) {
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <span key={s.num} style={{ display: "contents" }}>
          <div className="stepItem">
            <div
              className={`stepNum ${
                step > s.num ? "done" : step === s.num ? "active" : ""
              }`}
            >
              {step > s.num ? "OK" : s.num}
            </div>
            <span>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`stepConnector ${step > s.num ? "done" : ""}`} />
          )}
        </span>
      ))}
    </div>
  );
}
