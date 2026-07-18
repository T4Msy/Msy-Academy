import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Termos de Uso" };

export default function TermosPage() {
  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="brand">
            <Logo />
            <span className="brand-title">MSY Academy</span>
          </Link>
          <Link href="/" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm">
            Voltar
          </Link>
        </div>
      </header>

      <main className="legal-page">
        <h1>Termos de Uso</h1>
        <p className="legal-updated">Última atualização: julho de 2026</p>

        <div className="legal-content">
          <h2>1. Sobre a plataforma</h2>
          <p>
            A MSY Academy é uma plataforma educacional que usa inteligência artificial para
            ajudar professores a criar provas, atividades, planos de aula e a acompanhar suas
            turmas, e ajuda alunos a estudar, tirar dúvidas e revisar conteúdo. Ao criar uma
            conta, você concorda com estes Termos e com a nossa{" "}
            <Link href="/privacidade">Política de Privacidade</Link>.
          </p>
          <p>
            <b>Responsável pela plataforma:</b> TODO — inserir nome empresarial ou nome completo do responsável.<br />
            <b>CNPJ ou CPF:</b> TODO.<br />
            <b>Endereço:</b> TODO.<br />
            <b>Contato oficial:</b> TODO — inserir e-mail de atendimento.
          </p>

          <h2>2. Conta e responsabilidade</h2>
          <ul>
            <li>Você é responsável por manter suas credenciais em sigilo e por toda atividade realizada na sua conta.</li>
            <li>As informações de cadastro devem ser verdadeiras e mantidas atualizadas.</li>
            <li>Alunos menores de idade devem usar a plataforma com a participação e, quando necessário, a autorização de um responsável legal.</li>
          </ul>

          <h2>3. Conteúdo gerado por inteligência artificial</h2>
          <p>
            Provas, atividades, planos de aula, sugestões de correção e respostas do tutor de IA
            são gerados por modelos de linguagem e podem conter imprecisões. Recomendamos revisão
            humana antes de aplicar qualquer conteúdo gerado em sala de aula ou de usar sugestões
            de nota como decisão final. A MSY Academy não garante a exatidão pedagógica do
            conteúdo gerado.
          </p>

          <h2>4. Uso aceitável</h2>
          <ul>
            <li>Não é permitido usar a plataforma para gerar conteúdo ilegal, discriminatório ou que viole direitos de terceiros.</li>
            <li>Não é permitido tentar contornar limites de uso/cota de IA, extrair dados de outros usuários ou comprometer a segurança da plataforma.</li>
            <li>Contas suspeitas de abuso podem ser suspensas enquanto o caso é analisado.</li>
          </ul>

          <h2>5. Planos, cota de IA e cobrança</h2>
          <p>
            Alguns recursos dependem de assinatura paga. Antes da contratação, a plataforma
            informa o preço, a periodicidade da cobrança e os recursos incluídos. A cobrança é
            recorrente e processada por um provedor de pagamentos. Cada plano pode incluir limites
            mensais de uso de inteligência artificial; quando o limite for atingido, determinados
            recursos podem ficar indisponíveis até a renovação do período ou a mudança de plano.
          </p>
          <p>
            Você pode cancelar a renovação da assinatura nas Configurações. O cancelamento impede
            novas cobranças e, salvo indicação diferente no momento da contratação, o acesso ao
            plano pago permanece até o fim do período já pago. Valores vencidos, estornos e
            reembolsos seguem a legislação aplicável e as condições apresentadas na contratação.
          </p>

          <h2>6. Suspensão e encerramento da conta</h2>
          <p>
            Você pode encerrar sua conta pelas Configurações. Também podemos restringir ou
            suspender o acesso em caso de risco à segurança, falta de pagamento, uso abusivo ou
            violação destes Termos. Sempre que possível, informaremos o motivo e permitiremos a
            regularização. Violações graves, fraude ou obrigação legal podem exigir suspensão
            imediata. O encerramento não elimina obrigações pendentes nem dados que precisem ser
            mantidos pelo prazo exigido em lei.
          </p>

          <h2>7. Propriedade do conteúdo</h2>
          <p>
            O conteúdo que você cria ou envia (provas, materiais, respostas) continua seu. Você
            concede à MSY Academy uma licença limitada para armazenar, processar e exibir esse
            conteúdo dentro da plataforma, inclusive para gerar as funcionalidades solicitadas por
            você (ex.: enviar um material para o tutor de IA responder com base nele).
          </p>

          <h2>8. Disponibilidade e mudanças no serviço</h2>
          <p>
            Trabalhamos para manter a plataforma disponível, mas podem ocorrer interrupções por
            manutenção, atualizações, falhas técnicas, serviços de terceiros ou situações fora do
            nosso controle. Quando possível, manutenções planejadas serão comunicadas com
            antecedência. Recursos podem ser corrigidos, substituídos ou descontinuados para
            melhorar o serviço, atender requisitos legais ou preservar sua segurança.
          </p>

          <h2>9. Limitação de responsabilidade</h2>
          <p>
            A plataforma é fornecida &ldquo;como está&rdquo;. Na máxima extensão permitida por lei, a MSY
            Academy não se responsabiliza por danos indiretos decorrentes do uso da plataforma ou
            de decisões pedagógicas tomadas com base em conteúdo gerado por IA.
          </p>

          <h2>10. Alterações destes Termos</h2>
          <p>
            Podemos atualizar estes Termos periodicamente. Mudanças relevantes serão comunicadas
            na plataforma antes de entrarem em vigor.
          </p>

          <h2>11. Lei aplicável</h2>
          <p>Estes Termos são regidos pelas leis da República Federativa do Brasil.</p>

          <h2>12. Contato</h2>
          <p>
            Dúvidas sobre estes Termos, cobranças, cancelamento ou sua conta podem ser enviadas
            para: <b>TODO — inserir e-mail oficial de atendimento.</b>
          </p>
        </div>
      </main>
    </>
  );
}
