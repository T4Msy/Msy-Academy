import Link from "next/link";
import { Logo } from "@/components/Logo";

const FEATURES = [
  {
    title: "Multi-IA sob seu controle",
    desc: "Escolha o motor certo para cada matéria — a MSY Academy roteia entre provedores por trás de uma única interface.",
    icon: (
      <path
        d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Provas editáveis, não HTML cru",
    desc: "A IA gera questão por questão como dados estruturados — edite, reordene e reaproveite no Banco de Questões.",
    icon: (
      <path
        d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Turmas e atribuições",
    desc: "Crie turmas, convide alunos por código e atribua provas e atividades com prazo.",
    icon: (
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Tutor IA para o aluno",
    desc: "Chat com IA que responde com base no material da própria turma — não respostas genéricas.",
    icon: (
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Correção inteligente",
    desc: "Objetivas corrigem na hora; discursivas recebem nota e feedback sugeridos pela IA, revisados por você.",
    icon: (
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Dados isolados e seguros",
    desc: "Cada conta tem seus próprios dados protegidos por Row-Level Security no banco.",
    icon: (
      <path
        d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

const STEPS = [
  {
    n: 1,
    title: "Escolha seu papel",
    desc: "Professor, aluno, ou os dois — você troca de ambiente sem precisar de duas contas.",
  },
  {
    n: 2,
    title: "Crie e atribua",
    desc: "Gere provas, atividades e planos de aula com IA; atribua a uma turma com prazo.",
  },
  {
    n: 3,
    title: "Acompanhe",
    desc: "Alunos resolvem, a correção acontece automaticamente e você vê o desempenho da turma.",
  },
];

export default function Home() {
  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <Logo />
            <div>
              <div className="brand-title">MSY Academy</div>
              <div className="brand-sub">Copiloto educacional com IA</div>
            </div>
          </div>
          <div className="landing-header-actions">
            <Link href="/login" className="btn btn-ghost btn-sm">
              Entrar
            </Link>
            <Link href="/cadastro" className="btn btn-primary btn-sm">
              Criar conta grátis
            </Link>
          </div>
        </div>
      </header>

      <main role="main">
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-copy">
              <span className="hero-badge">Professor e Aluno, uma plataforma só</span>
              <h1 className="hero-title">
                Ensinar e estudar,
                <br />
                com IA em cada etapa.
              </h1>
              <p className="hero-sub">
                Provas, atividades, turmas, correção e um tutor de IA para o
                aluno — tudo integrado, não módulos soltos. Comece pelo
                gerador de provas e cresça com a turma inteira.
              </p>
              <div className="hero-actions">
                <Link href="/cadastro" className="btn btn-primary btn-generate">
                  Criar conta grátis
                </Link>
                <Link href="#como-funciona" className="btn btn-ghost btn-generate">
                  Ver como funciona
                </Link>
              </div>
            </div>

            <div className="hero-mock" aria-hidden="true">
              <div className="card card--highlight">
                <div className="card-header">
                  <div className="card-title-group">
                    <div className="step-badge step-badge--accent">Turma 3º B</div>
                    <h2 className="card-title">Avaliação Bimestral</h2>
                  </div>
                </div>
                <div className="card-body">
                  <div className="exam-meta">
                    <span className="chip">Biologia</span>
                    <span className="chip">12 questões</span>
                    <span className="chip">Atribuída</span>
                  </div>
                  <div className="hero-mock-lines">
                    <div className="hero-mock-line" style={{ width: "92%" }} />
                    <div className="hero-mock-line" style={{ width: "78%" }} />
                    <div className="hero-mock-line" style={{ width: "85%" }} />
                    <div className="hero-mock-line" style={{ width: "60%" }} />
                  </div>
                  <div className="result-actions">
                    <span className="btn btn-ghost btn-sm">18/22 entregaram</span>
                    <span className="btn btn-ghost btn-sm">Corrigir</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <div className="section-head">
              <span className="section-eyebrow">Por que a MSY Academy</span>
              <h2 className="section-title">Uma plataforma para o ciclo inteiro</h2>
            </div>
            <div className="features-grid">
              {FEATURES.map((f) => (
                <div key={f.title} className="feature-card">
                  <div className="card-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      {f.icon}
                    </svg>
                  </div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="como-funciona">
          <div className="section-inner">
            <div className="section-head">
              <span className="section-eyebrow">Como funciona</span>
              <h2 className="section-title">Do cadastro à turma em produção</h2>
            </div>
            <div className="steps-row">
              {STEPS.map((s) => (
                <div key={s.n} className="step-item">
                  <div className="step-num">{s.n}</div>
                  <h3 className="step-item-title">{s.title}</h3>
                  <p className="step-item-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <div className="cta-band">
              <h2 className="cta-title">Comece pela sua primeira prova</h2>
              <p className="cta-sub">Grátis para começar. Leva menos de um minuto.</p>
              <Link href="/cadastro" className="btn btn-primary btn-generate">
                Criar conta grátis
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="brand">
            <Logo size={26} />
            <span className="brand-title" style={{ fontSize: 14 }}>
              MSY Academy
            </span>
          </div>
          <nav className="landing-footer-links">
            <Link href="/login" className="nav-link">
              Entrar
            </Link>
            <Link href="/cadastro" className="nav-link">
              Criar conta
            </Link>
          </nav>
          <span className="landing-footer-copy">
            © {new Date().getFullYear()} MSY Academy. Feito no Brasil.
          </span>
        </div>
      </footer>
    </>
  );
}
