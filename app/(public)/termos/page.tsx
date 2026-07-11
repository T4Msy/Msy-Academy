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
          <Link href="/" className="btn btn-ghost btn-sm">
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

          <h2>2. Conta e responsabilidade</h2>
          <ul>
            <li>Você é responsável por manter suas credenciais em sigilo e por toda atividade realizada na sua conta.</li>
            <li>As informações de cadastro devem ser verdadeiras e mantidas atualizadas.</li>
            <li>Contas de alunos menores de idade devem ser usadas sob supervisão de um responsável legal ou de uma instituição de ensino.</li>
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
            Alguns recursos exigem um plano pago, cobrado por assinatura recorrente e processado
            por um provedor de pagamentos terceiro. Cada plano inclui uma cota mensal de uso de
            IA; ao atingi-la, pode ser necessário aguardar a renovação ou fazer upgrade de plano.
            Você pode cancelar sua assinatura a qualquer momento nas Configurações da conta.
          </p>

          <h2>6. Propriedade do conteúdo</h2>
          <p>
            O conteúdo que você cria ou envia (provas, materiais, respostas) continua seu. Você
            concede à MSY Academy uma licença limitada para armazenar, processar e exibir esse
            conteúdo dentro da plataforma, inclusive para gerar as funcionalidades solicitadas por
            você (ex.: enviar um material para o tutor de IA responder com base nele).
          </p>

          <h2>7. Limitação de responsabilidade</h2>
          <p>
            A plataforma é fornecida "como está". Na máxima extensão permitida por lei, a MSY
            Academy não se responsabiliza por danos indiretos decorrentes do uso da plataforma ou
            de decisões pedagógicas tomadas com base em conteúdo gerado por IA.
          </p>

          <h2>8. Alterações</h2>
          <p>
            Podemos atualizar estes Termos periodicamente. Mudanças relevantes serão comunicadas
            na plataforma antes de entrarem em vigor.
          </p>

          <h2>9. Lei aplicável</h2>
          <p>Estes Termos são regidos pelas leis da República Federativa do Brasil.</p>
        </div>

        <div className="legal-note">
          Este documento é uma versão inicial, escrita para acompanhar o lançamento da
          plataforma. Recomendamos revisão jurídica antes de uma operação comercial em escala.
        </div>
      </main>
    </>
  );
}
