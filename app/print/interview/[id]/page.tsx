import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  BLOOD_TYPE_LABELS,
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  PROFICIENCY_LABELS,
  RELIGION_LABELS,
  asRows,
  type BloodType,
  type DriverGender,
  type FamilyMember,
  type FormalEducationRow,
  type LanguageRow,
  type MaritalStatus,
  type NonFormalEducationRow,
  type Proficiency,
  type Religion,
  type WorkExperienceRow,
} from "@/lib/interview-utils";
import { AutoPrint, PrintButton } from "./auto-print";

export const metadata: Metadata = {
  title: "Form Interview — Bali Sun Tours",
  robots: { index: false, follow: false },
};

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;

function fmtDateOnly(iso: string | Date | null): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + WITA_OFFSET_MS);
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS_ID[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function v(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return "";
  const t = String(s).trim();
  return t;
}
function prof(p: Proficiency | undefined): string {
  return p ? PROFICIENCY_LABELS[p as Exclude<Proficiency, "">] : "";
}
function yn(b: boolean): string {
  return b ? "Ya" : "Tidak";
}
function ynText(yes: boolean, text: string | null): string {
  if (!yes) return "Tidak";
  const t = (text ?? "").trim();
  return t ? `Ya — ${t}` : "Ya";
}

export default async function InterviewPrintPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const p = await prisma.interviewSubmission.findUnique({ where: { id: params.id } });
  if (!p) redirect("/dashboard/interview");

  const familyImmediate = asRows<FamilyMember>(p.familyImmediate);
  const familyExtended = asRows<FamilyMember>(p.familyExtended);
  const formal = asRows<FormalEducationRow>(p.formalEducation);
  const nonFormal = asRows<NonFormalEducationRow>(p.nonFormalEducation);
  const languages = asRows<LanguageRow>(p.languages);
  const work = asRows<WorkExperienceRow>(p.workExperience);

  const ttl = [v(p.birthPlace), fmtDateOnly(p.birthDate)].filter(Boolean).join(", ");
  const tb = [v(p.heightCm) && `${v(p.heightCm)} cm`, v(p.weightKg) && `${v(p.weightKg)} kg`]
    .filter(Boolean)
    .join(" / ");
  const marital =
    (MARITAL_STATUS_LABELS[p.maritalStatus as MaritalStatus] ?? "") +
    (p.childrenCount !== null ? ` — dengan ${p.childrenCount} anak` : "");
  const sim = [
    v(p.simA) && `A: ${v(p.simA)}`,
    v(p.simB) && `B: ${v(p.simB)}`,
    v(p.simC) && `C: ${v(p.simC)}`,
  ].filter(Boolean).join("   ") || "—";

  return (
    <>
      <AutoPrint />
      <style>{`
        @page { size: A4; margin: 12mm 12mm 14mm 12mm; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          font-size: 9pt; color: #1a1a1a; background: #e5e7eb;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .page { box-shadow: none !important; margin: 0 !important; }
          nextjs-portal { display: none !important; }
        }
        .action-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 999;
          background: #0f172a; padding: 9px 20px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .action-bar-info { font-size: 12px; color: #94a3b8; }
        .action-bar-info strong { color: #e2e8f0; }
        .btn-back {
          background: transparent; color: #94a3b8; border: 1px solid #334155;
          padding: 6px 12px; border-radius: 6px; font-size: 12px;
          text-decoration: none;
        }
        .wrap { padding: 60px 0 40px; }
        @media print { .wrap { padding: 0; } }
        .page {
          width: 186mm; margin: 0 auto; background: white; padding: 6mm 7mm;
          box-shadow: 0 1px 10px rgba(0,0,0,.15);
        }

        /* ── letterhead ── */
        .head { display: flex; justify-content: space-between; align-items: flex-start;
          border-bottom: 2px solid #3AAA35; padding-bottom: 6px; }
        .brand { font-size: 15pt; font-weight: 800; color: #3AAA35; letter-spacing: .02em; }
        .brand small { display:block; font-size: 7pt; font-weight: 600; color:#2563eb; letter-spacing:.2em; }
        .company { text-align: right; font-size: 7.5pt; line-height: 1.5; }
        .company .cname { font-weight: 800; color: #2563eb; font-size: 9pt; }
        .company .cdesc { color: #3AAA35; }

        .formmeta { display:flex; justify-content:space-between; margin-top:6px; font-size:7.5pt; color:#444; }
        .title { text-align: center; margin: 2px 0 8px; }
        .title h1 { font-size: 14pt; font-weight: 800; letter-spacing: .04em; }
        .title p { font-size: 7.5pt; font-style: italic; color:#555; }

        /* ── section ── */
        .sec-title {
          background: #3AAA35; color: #fff; font-weight: 700; font-size: 8.5pt;
          padding: 2px 6px; margin: 9px 0 5px; letter-spacing:.03em;
        }
        .posisi { margin: 2px 0 6px; font-size: 9pt; }
        .posisi b { display:inline-block; min-width: 120px; }
        .posisi .val { border-bottom: 1px solid #333; padding: 0 6px; font-weight:700; }

        /* identity grid */
        .idrow { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 14px; }
        .f { display: flex; gap: 4px; align-items: baseline; padding: 1.5px 0; }
        .f .lbl { width: 42%; color: #333; flex-shrink: 0; }
        .f .val { flex: 1; border-bottom: 1px dotted #9ca3af; min-height: 13px;
          padding: 0 3px; font-weight: 600; word-break: break-word; }
        .f.full { grid-column: 1 / -1; }
        .f.full .lbl { width: 21%; }

        /* photo box */
        .photo-box {
          float: right; width: 26mm; height: 34mm; border: 1px dashed #999;
          margin: 0 0 4px 8px; display:flex; align-items:center; justify-content:center;
          font-size: 7pt; color:#999; overflow:hidden; background:#fafafa;
        }
        .photo-box img { width:100%; height:100%; object-fit: cover; }

        /* tables */
        table { width: 100%; border-collapse: collapse; font-size: 7.8pt; }
        th, td { border: 1px solid #94a3b8; padding: 3px 5px; text-align: left; vertical-align: top; }
        th { background: #eef2f7; font-weight: 700; }
        td .rl { font-weight:700; background:#f8fafc; }
        .nowrap { white-space: nowrap; }

        /* G list */
        .gitem { padding: 2.5px 0; border-bottom: 1px dotted #d1d5db; }
        .gitem .q { color:#333; }
        .gitem .a { font-weight: 700; padding-left: 4px; }

        .fgrid2 { display:grid; grid-template-columns:1fr 1fr; gap:2px 14px; }

        /* declaration + sign */
        .decl { margin-top: 10px; font-size: 7.5pt; font-style: italic; color:#444;
          border:1px solid #e5e7eb; background:#fafafa; padding:6px 8px; line-height:1.5; }
        .sign { display:flex; justify-content: space-between; margin-top: 14px; font-size:8pt; }
        .sign .box { width: 45%; text-align:center; }
        .sign .line { margin-top: 30px; border-top: 1px solid #333; padding-top: 3px; }
        .muted { color:#9ca3af; }
      `}</style>

      {/* screen-only action bar */}
      <div className="action-bar no-print">
        <div className="action-bar-info">
          Pratinjau PDF · <strong>{v(p.fullName)}</strong> — {v(p.appliedPosition)}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/dashboard/interview" className="btn-back">← Kembali</a>
          <PrintButton />
        </div>
      </div>

      <div className="wrap">
        <div className="page" suppressHydrationWarning>
          {/* letterhead */}
          <div className="head">
            <div className="brand">
              BALI SUN TOURS
              <small>TALENT</small>
            </div>
            <div className="company">
              <div className="cname">PT SURYA UTAMA NIRMALA</div>
              <div className="cdesc">Jl. Gunung Talang, Graha Asih B.9,</div>
              <div className="cdesc">Padangsambian, Denpasar - Bali</div>
              <div>info@balisuntours.com</div>
              <div>+62 819 3610 9809</div>
            </div>
          </div>
          <div className="formmeta">
            <span>No. Form : FO-HR.SUN-008/FI</span>
            <span>No. Revisi : 00</span>
          </div>
          <div className="title">
            <h1>FORM INTERVIEW</h1>
            <p>Bacalah dengan teliti, isi dengan huruf cetak</p>
          </div>

          <div className="posisi">
            <b>Posisi yang dilamar</b> : <span className="val">{v(p.appliedPosition) || "—"}</span>
          </div>

          {/* A. IDENTITAS */}
          <div className="sec-title">A. IDENTITAS</div>
          <div className="photo-box">
            {p.photoUrl ? <img src={p.photoUrl} alt="Foto" /> : <span>photo 4x6</span>}
          </div>
          <div className="idrow">
            <Field lbl="Nama Lengkap" val={v(p.fullName)} />
            <Field lbl="Nama Panggilan" val={v(p.nickname)} />
            <Field lbl="Tempat/Tgl. lahir" val={ttl} />
            <Field lbl="Jenis Kelamin" val={GENDER_LABELS[p.gender as DriverGender] ?? ""} />
            <Field lbl="Tinggi/Berat Badan" val={tb} />
            <Field lbl="Golongan Darah" val={BLOOD_TYPE_LABELS[p.bloodType as BloodType] ?? ""} />
            <Field lbl="No.Telp Rumah" val={v(p.homePhone)} />
            <Field lbl="No. Rek BCA" val={v(p.bcaAccount)} />
            <FieldFull lbl="Alamat sesuai KTP" val={v(p.ktpAddress)} />
            <FieldFull lbl="Alamat Domisili" val={v(p.currentAddress)} />
            <Field lbl="Kewarganegaraan" val={v(p.citizenship)} />
            <Field lbl="Email pribadi" val={v(p.personalEmail)} />
            <Field lbl="Status Pernikahan" val={marital} />
            <Field lbl="Agama" val={RELIGION_LABELS[p.religion as Religion] ?? ""} />
            <Field lbl="No KTP" val={v(p.nik)} />
            <Field lbl="No. Handphone" val={v(p.phone)} />
            <FieldFull lbl="No SIM" val={sim} />
          </div>

          {/* B. DATA KELUARGA */}
          <div className="sec-title">B. DATA KELUARGA</div>
          <FamilyTable rows={familyImmediate} />
          <div style={{ height: 5 }} />
          <FamilyTable rows={familyExtended} />

          {/* C. PENDIDIKAN FORMAL */}
          <div className="sec-title">C. PENDIDIKAN FORMAL</div>
          <table>
            <thead>
              <tr>
                <th>Institusi</th><th>Periode (dari–sampai)</th><th>Jurusan</th>
                <th>Tempat</th><th>Ijasah</th><th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {formal.length === 0 ? (
                <EmptyRow cols={6} />
              ) : (
                formal.map((r, i) => (
                  <tr key={i}>
                    <td>{v(r.institution)}</td>
                    <td>{[v(r.periodFrom), v(r.periodTo)].filter(Boolean).join(" – ")}</td>
                    <td>{v(r.major)}</td><td>{v(r.place)}</td>
                    <td>{v(r.diploma)}</td><td>{v(r.notes)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* D. PENDIDIKAN NON-FORMAL */}
          <div className="sec-title">D. PENDIDIKAN NON-FORMAL / PELATIHAN / KURSUS</div>
          <table>
            <thead>
              <tr><th>Pelatihan</th><th>Penyelenggara</th><th>Tahun</th><th>Tempat</th><th>Keterangan</th></tr>
            </thead>
            <tbody>
              {nonFormal.length === 0 ? (
                <EmptyRow cols={5} />
              ) : (
                nonFormal.map((r, i) => (
                  <tr key={i}>
                    <td>{v(r.training)}</td><td>{v(r.organizer)}</td>
                    <td>{v(r.year)}</td><td>{v(r.place)}</td><td>{v(r.notes)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* E. BAHASA */}
          <div className="sec-title">E. PENGUASAAN BAHASA ASING</div>
          <table>
            <thead>
              <tr><th>Bahasa</th><th>Memahami</th><th>Berbicara</th><th>Membaca</th><th>Menulis</th><th>Keterangan</th></tr>
            </thead>
            <tbody>
              {languages.length === 0 ? (
                <EmptyRow cols={6} />
              ) : (
                languages.map((r, i) => (
                  <tr key={i}>
                    <td>{v(r.language)}</td><td>{prof(r.understand)}</td><td>{prof(r.speak)}</td>
                    <td>{prof(r.read)}</td><td>{prof(r.write)}</td><td>{v(r.notes)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* F. PENGALAMAN KERJA */}
          <div className="sec-title">F. PENGALAMAN KERJA</div>
          <table>
            <thead>
              <tr>
                <th>Nama Perusahaan</th><th>Periode (dari–sampai)</th><th>Jabatan</th>
                <th>Upah</th><th>Rekomendasi</th><th>Alasan Berhenti</th>
              </tr>
            </thead>
            <tbody>
              {work.length === 0 ? (
                <EmptyRow cols={6} />
              ) : (
                work.map((r, i) => (
                  <tr key={i}>
                    <td>{v(r.company)}</td>
                    <td>{[v(r.periodFrom), v(r.periodTo)].filter(Boolean).join(" – ")}</td>
                    <td>{v(r.position)}</td><td>{v(r.salary)}</td>
                    <td>{r.recommendation ? "Ada" : "Tidak"}</td><td>{v(r.reasonLeaving)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="idrow" style={{ marginTop: 5 }}>
            <FieldFull lbl="Uraian jabatan terakhir" val={v(p.lastJobDescription)} />
            <Field lbl="Total upah terakhir (Rp)" val={v(p.lastSalaryTotal)} />
            <Field lbl="Gaji diharapkan (Rp)" val={v(p.expectedSalary)} />
            <Field lbl="BPJS Ketenagakerjaan" val={p.hasBpjsTk ? `Ya — ${v(p.bpjsTkNumber)}` : "Tidak"} />
            <Field lbl="BPJS Kesehatan" val={p.hasBpjsKes ? `Ya — ${v(p.bpjsKesNumber)}` : "Tidak"} />
          </div>

          {/* G. LAIN-LAIN */}
          <div className="sec-title">G. LAIN-LAIN</div>
          <div className="fgrid2">
            <G q="1. Pernah terlibat masalah hukum hingga pengadilan?" a={ynText(p.qLegalIssueYes, p.qLegalIssue)} />
            <G q="2. Pernah diberhentikan / diskorsing dari tempat kerja?" a={ynText(p.qTerminatedYes, p.qTerminated)} />
            <G q="3. Apakah Anda merokok?" a={yn(p.qSmoking)} />
            <G q="4. Apakah Anda bertatto?" a={yn(p.qTattoo)} />
            <G q="5. Sakit serius/kecelakaan/operasi (5 th terakhir)?" a={ynText(p.qSeriousIllnessYes, p.qSeriousIllness)} />
            <G q="6. Memiliki alergi / penyakit kambuhan?" a={ynText(p.qAllergyYes, p.qAllergy)} />
            <G q="7. Memiliki penyakit kulit dan/atau paru-paru?" a={ynText(p.qSkinLungDiseaseYes, p.qSkinLungDisease)} />
            <G q="8. Memiliki penyakit bawaan / keturunan?" a={ynText(p.qHereditaryDiseaseYes, p.qHereditaryDisease)} />
          </div>
          <G q="9. Nama & no. HP atasan di tempat kerja sebelumnya (referensi)" a={v(p.qPrevSupervisor)} full />
          <div className="fgrid2">
            <G q="10. Kapan dapat mulai bekerja?" a={v(p.qStartDate)} />
            <G q="11. Pernah mengikuti organisasi?" a={v(p.qOrganization)} />
          </div>
          <G q="12. Kontak keluarga/kerabat untuk keadaan darurat (nama, no. HP, hubungan)" a={v(p.qEmergencyContact)} full />
          <G q="13. Teman/keluarga/kenalan yang bekerja di perusahaan ini?" a={v(p.qRelativeInCompany)} full />
          <G q="14. Pernah bekerja di Bali Sun Tours atau afiliasinya?" a={v(p.qWorkedAtBst)} full />

          {/* declaration */}
          <div className="decl">
            Dengan ini saya menyatakan bahwa semua informasi di atas adalah benar. Setiap
            ketidakbenaran atau penyimpangan informasi dalam formulir ini dapat dijadikan
            sebagai dasar untuk menolak lamaran saya. Begitu pula apabila saya telah
            diterima bekerja, saya bersedia untuk diberhentikan tanpa ganti rugi apapun dan
            dituntut sesuai peraturan perundangan yang berlaku apabila informasi yang
            tertera dalam formulir ini tidak benar.
          </div>
          <div className="sign">
            <div className="box">
              <div>Nama dan Tanda Tangan</div>
              <div className="line">{v(p.fullName)}</div>
            </div>
            <div className="box">
              <div>Tanggal</div>
              <div className="line">{fmtDateOnly(p.submittedAt)}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ lbl, val }: { lbl: string; val: string }) {
  return (
    <div className="f">
      <span className="lbl">{lbl}</span>
      <span className="val">{val || " "}</span>
    </div>
  );
}
function FieldFull({ lbl, val }: { lbl: string; val: string }) {
  return (
    <div className="f full">
      <span className="lbl">{lbl}</span>
      <span className="val">{val || " "}</span>
    </div>
  );
}
function G({ q, a, full }: { q: string; a: string; full?: boolean }) {
  return (
    <div className="gitem" style={full ? { gridColumn: "1 / -1" } : undefined}>
      <span className="q">{q}</span>
      <span className="a">{a || "—"}</span>
    </div>
  );
}
function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="muted" style={{ textAlign: "center" }}>
        — tidak diisi —
      </td>
    </tr>
  );
}
function FamilyTable({ rows }: { rows: FamilyMember[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th style={{ width: "18%" }}>Hubungan</th>
          <th>Nama</th>
          <th className="nowrap">Jenis Kelamin</th>
          <th className="nowrap">Tanggal lahir</th>
          <th>Pendidikan</th>
          <th>Pekerjaan</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <EmptyRow cols={6} />
        ) : (
          rows.map((r, i) => (
            <tr key={i}>
              <td className="rl">{r.role}</td>
              <td>{r.name}</td>
              <td>{r.gender}</td>
              <td>{r.birthDate}</td>
              <td>{r.education}</td>
              <td>{r.job}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
