export const VAK_KEY: Record<number, { A: "V" | "A" | "K"; B: "V" | "A" | "K"; C: "V" | "A" | "K" }> = {
  1:  { A: "V", B: "A", C: "K" },
  2:  { A: "A", B: "V", C: "K" },
  3:  { A: "A", B: "K", C: "V" },
  4:  { A: "V", B: "A", C: "K" },
  5:  { A: "V", B: "K", C: "A" },
  6:  { A: "K", B: "V", C: "A" },
  7:  { A: "V", B: "A", C: "K" },
  8:  { A: "V", B: "A", C: "K" },
  9:  { A: "A", B: "V", C: "K" },
  10: { A: "A", B: "K", C: "V" },
  11: { A: "V", B: "A", C: "K" },
  12: { A: "A", B: "V", C: "K" },
  13: { A: "A", B: "K", C: "V" },
  14: { A: "V", B: "A", C: "K" },
  15: { A: "V", B: "K", C: "A" },
  16: { A: "K", B: "V", C: "A" },
  17: { A: "V", B: "A", C: "K" },
  18: { A: "V", B: "A", C: "K" },
  19: { A: "A", B: "V", C: "K" },
  20: { A: "A", B: "K", C: "V" },
  21: { A: "V", B: "A", C: "K" },
  22: { A: "A", B: "V", C: "K" },
  23: { A: "A", B: "K", C: "V" },
  24: { A: "A", B: "V", C: "K" },
  25: { A: "V", B: "K", C: "A" },
  26: { A: "V", B: "V", C: "A" },
  27: { A: "V", B: "A", C: "K" },
  28: { A: "V", B: "A", C: "K" },
  29: { A: "A", B: "V", C: "K" },
  30: { A: "A", B: "K", C: "V" },
};

export type Style = "Visual" | "Auditory" | "Kinesthetic";

export type VAKScore = {
  scoreV: number;
  scoreA: number;
  scoreK: number;
  dominantStyle: Style;
};

export function calculateVAK(
  answers: { questionNo: number; answer: string }[],
): VAKScore {
  let V = 0;
  let A = 0;
  let K = 0;

  for (const { questionNo, answer } of answers) {
    const opt = answer as "A" | "B" | "C";
    const style = VAK_KEY[questionNo]?.[opt];
    if (style === "V") V++;
    else if (style === "A") A++;
    else if (style === "K") K++;
  }

  const dominantStyle: Style =
    V >= A && V >= K ? "Visual" : A >= V && A >= K ? "Auditory" : "Kinesthetic";

  return { scoreV: V, scoreA: A, scoreK: K, dominantStyle };
}

export const STYLE_DESCRIPTIONS: Record<Style, string> = {
  Visual:
    "Kamu belajar dan memproses informasi terbaik melalui visual dan tampilan. Gunakan diagram, grafik, dan catatan berwarna untuk membantumu menyerap informasi.",
  Auditory:
    "Kamu belajar dan memproses informasi terbaik melalui pendengaran dan diskusi. Coba diskusi kelompok, podcast, atau membaca dengan suara keras.",
  Kinesthetic:
    "Kamu belajar dan memproses informasi terbaik melalui praktik langsung dan pengalaman. Pelajari dengan mencoba, role-play, atau aktivitas fisik.",
};
