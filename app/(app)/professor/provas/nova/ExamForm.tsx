"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { IaProvider } from "@/lib/exam/types";

const IA_OPTIONS: { value: IaProvider; name: string; desc: string }[] = [
  { value: "perplexity", name: "Perplexity Sonar", desc: "Ideal para provas contextualizadas e bem explicadas (estilo ENEM)." },
  { value: "llama", name: "LLaMA", desc: "Indicado para provas gerais e rascunhos rápidos." },
  { value: "deepseek", name: "DeepSeek", desc: "Recomendado para provas técnicas e exatas (código, matemática)." },
  { value: "chatgpt", name: "ChatGPT", desc: "Equilibrado e versátil. Bom para clareza didática." },
  { value: "gemini", name: "Gemini", desc: "Forte em síntese e organização de enunciados." },
];

const STEPS = [
  { n: 1, label: "IA & Geral" },
  { n: 2, label: "Conteúdo" },
  { n: 3, label: "Formato" },
  { n: 4, label: "Apoio" },
  { n: 5, label: "Gerar" },
];

export function ExamForm() {
  const router = useRouter();

  // ── Form state ─────────────────────────────────────────────
  const [ia, setIa] = useState<IaProvider>("llama");
  const [curso, setCurso] = useState("");
  const [tituloprova, setTituloprova] = useState("");
  const [materia, setMateria] = useState("");
  const [assunto, setAssunto] = useState("");
  const [publico, setPublico] = useState("medio");
  const [estilo, setEstilo] = useState("escolar");
  const [observacoesprofessor, setObservacoes] = useState("");
  const [tipo, setTipo] = useState("multipla");
  const [quantidade, setQuantidade] = useState("10");
  const [pontos, setPontos] = useState("1");
  const [nivel, setNivel] = useState("medio");
  const [distniveis, setDistniveis] = useState("40/40/20");
  const [usarapostila, setUsarapostila] = useState(false);
  const [apostila, setApostila] = useState<File | null>(null);
  const [gabarito, setGabarito] = useState(true);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Scroll-driven progress tracker (parity with legacy) ────
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('.card[id^="step-"]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const n = Number(entry.target.id.replace("step-", ""));
            if (n) setActiveStep(n);
          }
        });
      },
      { threshold: 0.4 },
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  function handleFile(file: File | null) {
    if (file && !/\.pdf$/i.test(file.name)) {
      setErro("Por favor, envie apenas arquivos no formato .pdf");
      return;
    }
    setApostila(file);
    setUsarapostila(!!file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    const params = {
      curso, tituloprova, materia, assunto, publico, estilo, observacoesprofessor,
      tipo, quantidade, pontos, nivel, distniveis,
      usarapostila, ia, gabarito,
    };

    const body = new FormData();
    body.append("dados", JSON.stringify(params));
    if (apostila) body.append("apostila", apostila);

    try {
      const res = await fetch("/api/ai/exams/generate", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erro ${res.status}`);
      router.push(`/professor/provas/${data.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  return (
    <>
      {/* Progress tracker */}
      <div className="progress-track" aria-label="Progresso do formulário">
        <div className="progress-steps">
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: "contents" }}>
              <div className={`prog-step${activeStep === s.n ? " active" : ""}`}>
                <span>{s.n}</span>
                <b>{s.label}</b>
              </div>
              {i < STEPS.length - 1 && <div className="prog-divider" />}
            </div>
          ))}
        </div>
      </div>

      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        {/* ETAPA 1 — Configurações Gerais */}
        <section className="card" id="step-1">
          <div className="card-header">
            <div className="card-title-group">
              <div className="step-badge">Etapa 1</div>
              <h2 className="card-title">Configurações Gerais</h2>
            </div>
          </div>
          <div className="card-body">
            <fieldset className="field-group">
              <legend className="field-label">Inteligência Artificial</legend>
              <div className="ia-grid" role="radiogroup" aria-label="Escolha a Inteligência Artificial">
                {IA_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    className={`ia-tile${ia === opt.value ? " active" : ""}`}
                    role="radio"
                    aria-checked={ia === opt.value}
                    onClick={() => setIa(opt.value)}
                  >
                    <div className="ia-tile-header">
                      <div className="radio-dot" aria-hidden="true" />
                      <span className="ia-name">{opt.name}</span>
                    </div>
                    <p className="ia-desc">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <p className="field-hint">
                A seleção fica registrada com a prova; o roteamento entre provedores chega numa fase futura.
              </p>
            </fieldset>

            <div className="form-grid-2">
              <div className="form-field">
                <label className="field-label" htmlFor="curso">Curso</label>
                <input className="input" id="curso" value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  placeholder="Ex: Ensino Médio, Graduação..." />
              </div>
              <div className="form-field">
                <label className="field-label" htmlFor="tituloprova">Título da Prova</label>
                <input className="input" id="tituloprova" value={tituloprova}
                  onChange={(e) => setTituloprova(e.target.value)}
                  placeholder="Ex: Avaliação Bimestral" />
              </div>
            </div>
          </div>
        </section>

        {/* ETAPA 2 — Conteúdo */}
        <section className="card" id="step-2">
          <div className="card-header">
            <div className="card-title-group">
              <div className="step-badge">Etapa 2</div>
              <h2 className="card-title">Conteúdo da Prova</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="form-grid-2">
              <div className="form-field">
                <label className="field-label" htmlFor="materia">Matéria</label>
                <input className="input" id="materia" value={materia}
                  onChange={(e) => setMateria(e.target.value)}
                  placeholder="Ex: Informática, Matemática..." />
              </div>
              <div className="form-field">
                <label className="field-label" htmlFor="assunto">Assunto / Tema</label>
                <input className="input" id="assunto" value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Ex: Redes, Funções, HTML..." />
              </div>
              <div className="form-field">
                <label className="field-label" htmlFor="publico">Público-alvo</label>
                <select className="input" id="publico" value={publico}
                  onChange={(e) => setPublico(e.target.value)}>
                  <option value="infantil">Infantil</option>
                  <option value="fundamental">Fundamental</option>
                  <option value="medio">Ensino Médio</option>
                  <option value="graduacao">Graduação</option>
                  <option value="tecnico">Técnico</option>
                  <option value="concurso">Concurso</option>
                </select>
              </div>
              <div className="form-field">
                <label className="field-label" htmlFor="estilo">Estilo</label>
                <select className="input" id="estilo" value={estilo}
                  onChange={(e) => setEstilo(e.target.value)}>
                  <option value="escolar">Escolar (direto e didático)</option>
                  <option value="enem">ENEM (contextualizado)</option>
                  <option value="vestibular">Vestibular (mais cobrança)</option>
                  <option value="tecnico">Técnico (objetivo e prático)</option>
                  <option value="desafiador">Desafiador (nível alto)</option>
                </select>
              </div>
              <div className="form-field form-field--full">
                <label className="field-label" htmlFor="observacoesprofessor">Observações do professor</label>
                <textarea className="input" id="observacoesprofessor" value={observacoesprofessor}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: inclua exemplos práticos, enfoque em conceitos-chave, pegadinhas leves, etc." />
              </div>
            </div>
          </div>
        </section>

        {/* ETAPA 3 — Formato & Estrutura */}
        <section className="card" id="step-3">
          <div className="card-header">
            <div className="card-title-group">
              <div className="step-badge">Etapa 3</div>
              <h2 className="card-title">Formato & Estrutura</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="form-grid-2">
              <div className="form-field">
                <label className="field-label" htmlFor="tipo">Tipo de Questões</label>
                <select className="input" id="tipo" value={tipo}
                  onChange={(e) => setTipo(e.target.value)}>
                  <option value="multipla">Múltipla escolha</option>
                  <option value="vf">Verdadeiro / Falso</option>
                  <option value="discursiva">Discursiva</option>
                  <option value="mista">Mista</option>
                </select>
              </div>
              <div className="form-field">
                <label className="field-label" htmlFor="quantidade">Quantidade de Questões</label>
                <input className="input" id="quantidade" type="number" min={1} value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="field-label" htmlFor="pontos">Pontos por Questão</label>
                <input className="input" id="pontos" type="number" min={1} value={pontos}
                  onChange={(e) => setPontos(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="field-label" htmlFor="nivel">Nível</label>
                <select className="input" id="nivel" value={nivel}
                  onChange={(e) => setNivel(e.target.value)}>
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
                </select>
              </div>
              <div className="form-field form-field--full">
                <label className="field-label" htmlFor="distniveis">Distribuição de dificuldade</label>
                <select className="input" id="distniveis" value={distniveis}
                  onChange={(e) => setDistniveis(e.target.value)}>
                  <option value="40/40/20">40% fácil, 40% médio, 20% difícil</option>
                  <option value="30/50/20">30% fácil, 50% médio, 20% difícil</option>
                  <option value="25/50/25">25% fácil, 50% médio, 25% difícil</option>
                  <option value="20/40/40">20% fácil, 40% médio, 40% difícil</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* ETAPA 4 — Material de Apoio */}
        <section className="card" id="step-4">
          <div className="card-header">
            <div className="card-title-group">
              <div className="step-badge">Etapa 4</div>
              <h2 className="card-title">Material de Apoio</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="toggle-row">
              <div className="toggle-info">
                <b className="toggle-title">Usar apostila (PDF)</b>
                <span className="toggle-desc">
                  Envie um PDF de referência — a IA ainda não lê o conteúdo dele (chega numa fase futura), mas o arquivo já fica anexado à prova.
                </span>
              </div>
              <button
                type="button"
                className={`switch${usarapostila ? " on" : ""}`}
                role="switch"
                aria-checked={usarapostila}
                aria-label="Usar apostila"
                onClick={() => setUsarapostila((v) => !v)}
              />
            </div>

            <div className="form-field" style={{ marginTop: 16 }}>
              <label className="field-label">Arquivo PDF</label>
              <div
                className={`dropzone${dragOver ? " dragover" : ""}`}
                tabIndex={0}
                role="button"
                aria-label="Área de envio de PDF — arraste ou clique para selecionar"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files?.[0] ?? null);
                }}
              >
                <div className="dz-icon" aria-hidden="true">
                  <svg fill="none" width="24" height="24" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="dz-text">
                  <span className="dz-title">
                    {apostila ? apostila.name : "Arraste e solte seu PDF aqui"}
                  </span>
                  <span className="dz-hint">
                    {apostila
                      ? "PDF selecionado."
                      : "ou clique para selecionar o arquivo"}
                  </span>
                </div>
                <div className="dz-actions">
                  <button className="btn btn-ghost btn-sm" type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    Selecionar arquivo
                  </button>
                  {apostila && (
                    <button className="btn btn-danger-ghost btn-sm" type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        handleFile(null);
                      }}>
                      Remover
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                accept="application/pdf"
                className="visually-hidden"
                type="file"
                aria-hidden="true"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        </section>

        {/* ETAPA 5 — Finalizar */}
        <section className="card card--highlight" id="step-5">
          <div className="card-header">
            <div className="card-title-group">
              <div className="step-badge step-badge--accent">Etapa 5</div>
              <h2 className="card-title">Finalizar</h2>
            </div>
            <p className="card-subtitle">Gabarito e geração da prova.</p>
          </div>
          <div className="card-body">
            <label className="opt-check" htmlFor="gabarito">
              <input type="checkbox" id="gabarito" checked={gabarito}
                onChange={(e) => setGabarito(e.target.checked)} />
              <span className="opt-box" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="opt-text">
                <b>Incluir gabarito ao final</b>
                <span>Adiciona resposta de cada questão ao final do documento.</span>
              </span>
            </label>

            {erro && <div className="notice notice--error">{erro}</div>}

            <div className="submit-row">
              <div className="submit-chips">
                <span className="chip">Questões editáveis</span>
                <span className="chip">Salva automaticamente</span>
              </div>
              <button type="submit" className="btn btn-primary btn-generate" disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-loader" /> Gerando...
                  </>
                ) : (
                  "Gerar Prova"
                )}
              </button>
            </div>
          </div>
        </section>
      </form>
    </>
  );
}
