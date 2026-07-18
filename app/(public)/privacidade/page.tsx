import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PrivacidadePage() {
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
        <h1>Política de Privacidade</h1>
        <p className="legal-updated">Última atualização: julho de 2026</p>

        <div className="legal-content">
          <h2>1. Quais dados coletamos</h2>
          <ul>
            <li><b>Cadastro:</b> nome, e-mail e senha (ou login via Google).</li>
            <li>
              <b>Conteúdo que você cria:</b> provas, atividades, planos de aula, materiais
              enviados, turmas, respostas de alunos, conversas com o tutor de IA, planos de
              estudo e flashcards.
            </li>
            <li><b>Uso da plataforma:</b> métricas de uso de IA por conta, para aplicar a cota do seu plano.</li>
          </ul>

          <h2>2. Para que usamos seus dados e quais são as bases legais</h2>
          <ul>
            <li>Fornecer as funcionalidades da plataforma (gerar provas, corrigir, responder no tutor de IA, etc.).</li>
            <li>Manter sua conta segura e isolada dos dados de outras contas.</li>
            <li>Processar pagamentos e aplicar cotas do seu plano.</li>
            <li>Melhorar a plataforma e diagnosticar problemas técnicos.</li>
          </ul>
          <p>Dependendo da finalidade, o tratamento pode se apoiar nas seguintes bases legais:</p>
          <ul>
            <li><b>Execução de contrato:</b> para criar e manter sua conta e entregar os recursos solicitados.</li>
            <li><b>Cumprimento de obrigação legal ou regulatória:</b> quando a legislação exigir a conservação ou o fornecimento de informações.</li>
            <li><b>Legítimo interesse:</b> para segurança, prevenção de fraude, suporte e melhoria do serviço, com avaliação dos direitos do titular.</li>
            <li><b>Exercício regular de direitos:</b> para atender ou defender direitos em processos administrativos, judiciais ou arbitrais.</li>
            <li><b>Consentimento:</b> quando essa for a base adequada, especialmente em situações que envolvam dados de crianças e adolescentes.</li>
          </ul>

          <h2>3. Acesso entre contas e turmas</h2>
          <p>
            Usamos autenticação e controles de acesso para limitar as informações disponíveis a
            cada conta. Professores, alunos, responsáveis e instituições podem compartilhar dados
            quando participam da mesma turma ou usam um recurso que exige essa interação. Embora
            adotemos medidas para evitar acessos indevidos, nenhum sistema é totalmente imune a
            falhas ou incidentes de segurança.
          </p>

          <h2>4. Compartilhamento e processamento por terceiros</h2>
          <ul>
            <li>
              <b>Provedores de inteligência artificial:</b> o conteúdo enviado para geração
              (enunciados, materiais, mensagens do tutor) é processado por provedores de IA
              terceiros para produzir a resposta solicitada.
            </li>
            <li><b>Processador de pagamentos:</b> dados de cobrança são processados por um provedor terceiro especializado em pagamentos — não armazenamos números de cartão.</li>
            <li><b>Infraestrutura e armazenamento:</b> fornecedores de hospedagem, banco de dados, armazenamento e segurança podem processar dados para manter a plataforma funcionando.</li>
            <li>Não vendemos dados pessoais a terceiros.</li>
          </ul>
          <p>
            Alguns provedores de inteligência artificial e infraestrutura podem operar ou
            armazenar dados fora do Brasil. Nesses casos, buscamos fornecedores com medidas de
            segurança e mecanismos de transferência internacional compatíveis com a LGPD e com as
            regras aplicáveis.
          </p>

          <h2>5. Dados de crianças e adolescentes</h2>
          <p>
            Contas de alunos podem pertencer a menores de idade. O uso deve ocorrer sob
            supervisão de um responsável legal ou de uma instituição de ensino que tenha
            legitimidade para tratar esses dados no contexto educacional (Art. 14, LGPD).
            O tratamento deve observar o melhor interesse da criança ou do adolescente.
            Responsáveis, professores e instituições devem fornecer apenas os dados necessários e
            obter as autorizações exigidas para o contexto educacional.
          </p>

          <h2>6. Seus direitos</h2>
          <p>Nos termos da LGPD, você pode solicitar:</p>
          <ul>
            <li>confirmação da existência de tratamento e acesso aos dados;</li>
            <li>correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>informações sobre compartilhamento e portabilidade, quando aplicável;</li>
            <li>anonimização, bloqueio ou exclusão de dados tratados em desconformidade;</li>
            <li>revogação do consentimento e revisão das decisões tomadas com base nele, quando aplicável.</li>
          </ul>
          <p>
            Algumas ações estão disponíveis em Configurações, como corrigir o nome, exportar dados
            e solicitar a exclusão da conta. Outros pedidos podem ser enviados para o contato de
            privacidade indicado na seção 12. Podemos solicitar informações para confirmar sua
            identidade e proteger seus dados antes de atender ao pedido.
          </p>

          <h2>7. Retenção, exclusão e backups</h2>
          <p>
            Mantemos os dados enquanto forem necessários para oferecer a plataforma e cumprir as
            finalidades descritas nesta Política. Após o encerramento ou pedido de exclusão,
            eliminamos ou anonimizamos os dados quando possível, respeitando obrigações legais,
            prevenção de fraude, exercício de direitos e outros prazos aplicáveis. Cópias residuais
            podem permanecer temporariamente em backups protegidos até serem substituídas pelo
            ciclo normal de retenção e não são usadas para finalidades comuns do serviço.
          </p>

          <h2>8. Segurança</h2>
          <p>
            Toda comunicação com a plataforma é feita por HTTPS. O acesso a dados é controlado
            por autenticação e por políticas de isolamento por conta no banco de dados.
          </p>

          <h2>9. Cookies</h2>
          <p>
            Usamos apenas cookies estritamente necessários para manter sua sessão autenticada.
            Não usamos cookies de rastreamento publicitário.
          </p>

          <h2>10. Alterações desta Política</h2>
          <p>
            Esta Política pode ser atualizada para refletir mudanças na plataforma, na legislação
            ou em nossos fornecedores. Alterações relevantes serão comunicadas pelos canais
            disponíveis antes de entrarem em vigor, quando necessário.
          </p>

          <h2>11. Contato</h2>
          <p>
            Dúvidas, solicitações ou reclamações sobre o tratamento de dados podem ser enviadas
            para: <b>TODO — inserir e-mail específico de privacidade.</b>
          </p>

          <h2>12. Quem controla seus dados</h2>
          <p>
            O controlador dos dados pessoais tratados pela MSY Academy é: <b>TODO — inserir nome
            empresarial ou nome completo do responsável, CNPJ ou CPF e endereço.</b>
          </p>
          <p>
            Para assuntos de privacidade e proteção de dados, entre em contato pelo e-mail:
            <b> TODO — inserir contato específico de privacidade.</b>
          </p>
        </div>

        <div className="legal-note">
          Este documento é uma versão inicial, escrita para acompanhar o lançamento da
          plataforma. Recomendamos revisão jurídica antes de uma operação comercial em escala,
          incluindo a formalização de um encarregado de dados (DPO) conforme a LGPD.
        </div>
      </main>
    </>
  );
}
