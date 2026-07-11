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
          <Link href="/" className="btn btn-ghost btn-sm">
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

          <h2>2. Para que usamos seus dados</h2>
          <ul>
            <li>Fornecer as funcionalidades da plataforma (gerar provas, corrigir, responder no tutor de IA, etc.).</li>
            <li>Manter sua conta segura e isolada dos dados de outras contas.</li>
            <li>Processar pagamentos e aplicar cotas do seu plano.</li>
            <li>Melhorar a plataforma e diagnosticar problemas técnicos.</li>
          </ul>
          <p>
            A base legal para esse tratamento é a execução do contrato de uso da plataforma (Art.
            7º, V, LGPD) e, quando aplicável, o consentimento dado no cadastro.
          </p>

          <h2>3. Isolamento entre contas</h2>
          <p>
            Cada conta (professor, escola ou aluno) tem seus dados isolados por controle de
            acesso reforçado no próprio banco de dados (Row-Level Security) — uma conta nunca
            acessa dados de outra conta, exceto quando você explicitamente convida um aluno para
            sua turma ou vice-versa.
          </p>

          <h2>4. Compartilhamento com terceiros</h2>
          <ul>
            <li>
              <b>Provedores de inteligência artificial:</b> o conteúdo enviado para geração
              (enunciados, materiais, mensagens do tutor) é processado por provedores de IA
              terceiros para produzir a resposta solicitada.
            </li>
            <li><b>Processador de pagamentos:</b> dados de cobrança são processados por um provedor terceiro especializado em pagamentos — não armazenamos números de cartão.</li>
            <li>Não vendemos dados pessoais a terceiros.</li>
          </ul>

          <h2>5. Dados de menores de idade</h2>
          <p>
            Contas de alunos podem pertencer a menores de idade. O uso deve ocorrer sob
            supervisão de um responsável legal ou de uma instituição de ensino que tenha
            legitimidade para tratar esses dados no contexto educacional (Art. 14, LGPD).
            Professores e escolas são responsáveis por obter, quando exigido, a autorização
            adequada para o uso da plataforma por seus alunos.
          </p>

          <h2>6. Seus direitos</h2>
          <p>Como titular dos dados, você pode a qualquer momento, diretamente pela plataforma:</p>
          <ul>
            <li><b>Exportar</b> uma cópia de todos os seus dados, em Configurações → Meus dados.</li>
            <li><b>Excluir</b> permanentemente sua conta e conteúdo associado, em Configurações → Zona de perigo.</li>
            <li><b>Corrigir</b> seus dados de perfil (nome), também em Configurações.</li>
          </ul>

          <h2>7. Retenção</h2>
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir a conta, os dados
            são removidos permanentemente do banco de produção; cópias de backup são sobrescritas
            no ciclo normal de rotação de backups.
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

          <h2>10. Contato</h2>
          <p>
            Dúvidas sobre esta política ou sobre o tratamento dos seus dados podem ser
            enviadas para o e-mail de suporte informado no rodapé da plataforma.
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
