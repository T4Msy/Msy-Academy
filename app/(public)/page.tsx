import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { ScrollReveal } from "@/components/ScrollReveal";
import { listPlans } from "@/lib/billing/plans";

const LANDING_PLAN_DEFAULTS = [
  { id: "free", code: "FREE", name: "Gratuito", ai_quota_monthly: 50000, price_cents: 0, stripe_price_id: null },
  { id: "aluno", code: "ALUNO", name: "Aluno", ai_quota_monthly: 150000, price_cents: 1490, stripe_price_id: null },
  { id: "professor", code: "PROFESSOR", name: "Professor", ai_quota_monthly: 300000, price_cents: 2990, stripe_price_id: null },
  { id: "escola", code: "ESCOLA", name: "Escola", ai_quota_monthly: 1500000, price_cents: 9990, stripe_price_id: null },
] as const;

const FEATURES = [
  {
    title: "A melhor inteligência artificial para cada tarefa",
    desc: "Crie provas, atividades e planos de aula com a tecnologia mais adequada para cada necessidade, tudo em um só lugar.",
    cat: 1,
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
    title: "Provas que você pode revisar e editar",
    desc: "Revise cada questão, altere a ordem e reutilize o conteúdo no seu Banco de Questões.",
    cat: 2,
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
    cat: 5,
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
    title: "Tutor de IA para o aluno",
    desc: "Um tutor que responde com base nos materiais da própria turma, oferecendo explicações mais relevantes para cada aluno.",
    cat: 3,
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
    desc: "Questões objetivas são corrigidas na hora. Nas discursivas, a IA sugere nota e feedback para você revisar.",
    cat: 4,
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
    desc: "Cada conta mantém seus próprios dados separados e protegidos por controles de acesso no banco.",
    cat: 7,
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

const TRUST_POINTS = [
  { title: "Dados separados por conta", desc: "Cada conta acessa apenas as informações permitidas para professores, alunos e responsáveis vinculados." },
  { title: "Uso de IA fácil de acompanhar", desc: "Você consulta o uso incluído no seu plano diretamente nas Configurações." },
  { title: "Tecnologia que se adapta à tarefa", desc: "A plataforma pode usar diferentes serviços de inteligência artificial para entregar a melhor experiência em cada recurso." },
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

function formatPrice(cents: number): string {
  if (cents === 0) return "Grátis";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + "/mês";
}

export default async function Home() {
  const loadedPlans = await listPlans();
  const plans = LANDING_PLAN_DEFAULTS.map(
    (fallback) => loadedPlans.find((plan) => plan.code === fallback.code) ?? fallback,
  );

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
            <ThemeToggle variant="icon" />
            <Link href="/login" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm">
              Entrar
            </Link>
            <Link href="/cadastro" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm">
              Criar conta
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
                Economize tempo ao criar provas, atividades e planos de aula.
                Organize suas turmas, acompanhe o progresso e ofereça aos alunos
                novas formas de estudar em uma única plataforma.
              </p>
              <div className="hero-actions">
                <Link href="/cadastro" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 h-11.5 min-w-40 rounded-full px-5 font-display text-base tracking-[-0.2px]">
                  Criar conta grátis
                </Link>
                <Link href="#como-funciona" className="btn btn-ghost btn-generate">
                  Ver como funciona
                </Link>
              </div>
            </div>

            <div className="hero-mock" aria-hidden="true">
              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors border-brand-border [background:linear-gradient(135deg,var(--bg-card)_0%,rgba(217,119,87,0.03)_100%)]">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="step-badge step-badge--accent">Turma 3º B</div>
                    <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Avaliação Bimestral</h2>
                  </div>
                </div>
                <div className="flex flex-col gap-4.5 p-5.5">
                  <div className="mt-0.5 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Biologia</span>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">12 questões</span>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Atribuída</span>
                  </div>
                  <div className="hero-mock-lines">
                    <div className="hero-mock-line" style={{ width: "92%" }} />
                    <div className="hero-mock-line" style={{ width: "78%" }} />
                    <div className="hero-mock-line" style={{ width: "85%" }} />
                    <div className="hero-mock-line" style={{ width: "60%" }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm">18/22 entregaram</span>
                    <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm">Corrigir</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <ScrollReveal>
              <div className="section-head">
                <span className="section-eyebrow">Por que a MSY Academy</span>
                <h2 className="section-title">Uma plataforma para o ciclo inteiro</h2>
              </div>
            </ScrollReveal>
            <div className="features-grid">
              {FEATURES.map((f, i) => (
                <ScrollReveal key={f.title} className={`reveal-delay-${i % 3}`}>
                  <div className="feature-card">
                    <div className={`card-icon card-icon--cat-${f.cat}`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        {f.icon}
                      </svg>
                    </div>
                    <h3 className="feature-title">{f.title}</h3>
                    <p className="feature-desc">{f.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="como-funciona">
          <div className="section-inner">
            <ScrollReveal>
              <div className="section-head">
                <span className="section-eyebrow">Como funciona</span>
                <h2 className="section-title">Do cadastro à sua primeira turma</h2>
              </div>
            </ScrollReveal>
            <ScrollReveal>
              <div className="steps-row">
                {STEPS.map((s) => (
                  <div key={s.n} className="step-item">
                    <div className="step-num">{s.n}</div>
                    <h3 className="step-item-title">{s.title}</h3>
                    <p className="step-item-desc">{s.desc}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="section" id="planos">
          <div className="section-inner">
            <ScrollReveal>
              <div className="section-head">
                <span className="section-eyebrow">Planos</span>
                <h2 className="section-title">Comece grátis, cresça quando precisar</h2>
              </div>
            </ScrollReveal>
            <div className="pricing-grid">
              {plans.map((plan, i) => (
                <ScrollReveal key={plan.code} className={`reveal-delay-${i % 3}`}>
                  <div className={`pricing-card${plan.code === "PROFESSOR" ? " pricing-card--highlight" : ""}`}>
                    {plan.code === "PROFESSOR" && <span className="pricing-badge">Mais popular</span>}
                    <h3 className="pricing-name">{plan.name}</h3>
                    <div className="pricing-price">{formatPrice(plan.price_cents)}</div>
                    <p className="pricing-quota">{plan.ai_quota_monthly.toLocaleString("pt-BR")} tokens de IA/mês</p>
                    <Link href="/cadastro" className="btn btn-ghost btn-block mt-md">
                      Criar conta grátis
                    </Link>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <ScrollReveal>
              <div className="trust-grid">
                {TRUST_POINTS.map((t) => (
                  <div key={t.title} className="trust-item">
                    <h3 className="trust-title">{t.title}</h3>
                    <p className="trust-desc">{t.desc}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <ScrollReveal>
              <div className="cta-band">
                <h2 className="cta-title">Comece pela sua primeira prova</h2>
                <p className="cta-sub">Grátis para começar. Leva menos de um minuto.</p>
                <Link href="/cadastro" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 h-11.5 min-w-40 rounded-full px-5 font-display text-base tracking-[-0.2px]">
                  Criar conta grátis
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="brand">
            <Logo size={26} />
            <span className="brand-title brand-title--sm">
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
            <Link href="/termos" className="nav-link">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="nav-link">
              Privacidade
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
