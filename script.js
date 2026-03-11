/**
 * ProvaGen — script.js
 * Front-end logic for the AI-powered exam generator.
 * Integrates with n8n webhook via FormData POST.
 */

/* ============================================================
   Constants
   ============================================================ */
const WEBHOOK_URL = 'https://warm-polls-treasury-gay.trycloudflare.com/webhook/gerar-prova';

/* ============================================================
   DOM References
   ============================================================ */
const elements = {
  form:           () => document.getElementById('formProva'),
  btnGerar:       () => document.getElementById('btnGerar'),
  resultado:      () => document.getElementById('resultado'),
  erro:           () => document.getElementById('erro'),
  cardProva:      () => document.getElementById('card-prova'),
  provaContainer: () => document.getElementById('prova-container'),
  provaHtmlDiv:   () => document.getElementById('prova-html'),
  iframe:         () => document.getElementById('preview'),
};

/* ============================================================
   IA Radio Tiles
   ============================================================ */
function initIaTiles() {
  const iaSelect = document.getElementById('ia');
  const iaTiles  = Array.from(document.querySelectorAll('[data-ia-tile]'));

  if (!iaSelect || iaTiles.length === 0) return;

  function activateTile(value) {
    iaSelect.value = value;
    iaTiles.forEach(tile => {
      const isActive = tile.getAttribute('data-ia-value') === value;
      tile.classList.toggle('active', isActive);
      tile.setAttribute('aria-checked', String(isActive));
    });
  }

  iaTiles.forEach(tile => {
    tile.addEventListener('click', () => activateTile(tile.getAttribute('data-ia-value')));
    tile.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateTile(tile.getAttribute('data-ia-value'));
      }
    });
  });

  // Sync if native select changes externally
  iaSelect.addEventListener('change', () => activateTile(iaSelect.value));

  // Init with current value
  activateTile(iaSelect.value);
}

/* ============================================================
   Toggle Switches
   ============================================================ */
function bindSwitch(checkboxId, switchId) {
  const checkbox = document.getElementById(checkboxId);
  const switchEl = document.getElementById(switchId);

  if (!checkbox || !switchEl) return;

  function syncVisual() {
    switchEl.classList.toggle('on', checkbox.checked);
    switchEl.setAttribute('aria-checked', String(checkbox.checked));
  }

  switchEl.addEventListener('click', () => {
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event('change'));
    syncVisual();
  });

  switchEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      switchEl.click();
    }
  });

  checkbox.addEventListener('change', syncVisual);

  syncVisual();
}

/* ============================================================
   Dropzone
   ============================================================ */
function initDropzone() {
  const dropzone    = document.getElementById('dropzone');
  const fileInput   = document.getElementById('apostila');
  const pickBtn     = document.getElementById('pickFile');
  const clearBtn    = document.getElementById('clearFile');
  const titleEl     = document.getElementById('dzTitle');
  const hintEl      = document.getElementById('dzHint');
  const useCheckbox = document.getElementById('usarapostila');

  if (!dropzone || !fileInput) return;

  function updateDropzoneUI(file) {
    if (file) {
      titleEl.textContent = file.name;
      hintEl.textContent  = 'PDF selecionado. A IA pode usar esse conteúdo.';
      clearBtn.style.display = 'inline-flex';
      useCheckbox.checked = true;
      useCheckbox.dispatchEvent(new Event('change'));
    } else {
      titleEl.textContent = 'Arraste e solte seu PDF aqui';
      hintEl.textContent  = 'ou clique para selecionar o arquivo';
      clearBtn.style.display = 'none';
      useCheckbox.checked = false;
      useCheckbox.dispatchEvent(new Event('change'));
    }
  }

  pickBtn.addEventListener('click', () => fileInput.click());

  clearBtn.addEventListener('click', () => {
    fileInput.value = '';
    updateDropzoneUI(null);
  });

  fileInput.addEventListener('change', () => {
    updateDropzoneUI(fileInput.files?.[0] ?? null);
  });

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!/\.pdf$/i.test(file.name)) {
      alert('⚠️ Por favor, envie apenas arquivos no formato .pdf');
      return;
    }

    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    updateDropzoneUI(file);
  });

  dropzone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  // Init with any pre-selected file
  updateDropzoneUI(fileInput.files?.[0] ?? null);
}

/* ============================================================
   Progress Steps — marks steps as "active" on card focus
   ============================================================ */
function initProgressTracker() {
  const steps = document.querySelectorAll('.prog-step');
  const cards = document.querySelectorAll('.card[id^="step-"]');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const stepNum = entry.target.id.replace('step-', '');
        steps.forEach(s => {
          s.classList.toggle('active', s.dataset.step === stepNum);
        });
      }
    });
  }, { threshold: 0.4 });

  cards.forEach(card => observer.observe(card));
}

/* ============================================================
   HTML Extraction (robust n8n / OpenAI response parser)
   ============================================================ */
function extractHtmlProva(data) {
  // 1) Direct field names from n8n/webhook
  let html =
    data?.htmlprova ??
    data?.html_prova ??
    data?.htmlProva ??
    data?.examString ??
    data?.prova_html;

  // 2) If value is nested object, dig into common sub-keys
  if (html && typeof html === 'object') {
    html = html.html ?? html.content ?? html.data ?? html.value ?? null;
  }

  // 3) OpenAI / Groq wrapped response
  if (!html) {
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text;

    if (typeof content === 'string' && content.trim()) {
      if (content.includes('<html') || content.includes('<!DOCTYPE') || content.includes('<body')) {
        html = content;
      } else {
        try {
          const parsed = JSON.parse(content);
          html = parsed?.htmlprova ?? parsed?.html_prova ?? parsed?.examString ?? null;
        } catch (_) { /* not JSON */ }
      }
    }
  }

  // 4) Final validation
  if (typeof html !== 'string' || !html.trim() || html.trim() === 'undefined') {
    const keys = data && typeof data === 'object' ? Object.keys(data) : [];
    throw new Error(`Resposta sem HTML válido. Keys recebidas: ${keys.join(', ')}`);
  }

  return html;
}

/* ============================================================
   UI Helpers
   ============================================================ */
function buildPayload() {
  return {
    curso:                 document.getElementById('curso').value.trim(),
    tituloprova:           document.getElementById('tituloprova').value.trim(),
    pontosporquestao:      parseInt(document.getElementById('pontos').value, 10),
    materia:               document.getElementById('materia').value.trim(),
    assunto:               document.getElementById('assunto').value.trim(),
    quantidade:            parseInt(document.getElementById('quantidade').value, 10),
    nivel:                 document.getElementById('nivel').value,
    tipo:                  document.getElementById('tipo').value,
    estilo:                document.getElementById('estilo').value,
    publico:               document.getElementById('publico').value.trim(),
    incluirgabarito:       document.getElementById('gabarito').checked,
    versoes:               1,
    distniveis:            document.getElementById('distniveis').value.trim(),
    usarapostila:          document.getElementById('usarapostila').checked,
    ia:                    document.getElementById('ia').value,
    observacoesprofessor:  document.getElementById('observacoesprofessor').value.trim(),
  };
}

function showResultado(html) {
  const el = elements.resultado();
  el.innerHTML = html;
  el.style.display = 'block';
}

function showErro(message) {
  const el = elements.erro();
  el.innerHTML = `<strong>Erro ao gerar prova:</strong> ${message}`;
  el.style.display = 'block';
}

function clearFeedback() {
  const resultado = elements.resultado();
  const erro      = elements.erro();
  resultado.style.display = 'none';
  resultado.innerHTML = '';
  erro.style.display = 'none';
  erro.innerHTML = '';
}

function setLoadingState(isLoading) {
  const btn = elements.btnGerar();
  btn.disabled = isLoading;

  if (isLoading) {
    btn._originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="btn-loader"></span> Gerando...';
  } else {
    btn.innerHTML = btn._originalHTML || 'Gerar Prova';
  }
}

function renderProva(htmlProva, data, payload) {
  const cardProva      = elements.cardProva();
  const provaContainer = elements.provaContainer();
  const provaHtmlDiv   = elements.provaHtmlDiv();
  const iframe         = elements.iframe();

  // Populate hidden export container
  provaHtmlDiv.innerHTML = htmlProva;
  provaHtmlDiv.style.display = 'none';

  // Render iframe preview with light theme
  iframe.srcdoc = `
    <style>
      * { box-sizing: border-box; }
      body {
        background: #fff !important;
        color: #111 !important;
        font-family: Arial, sans-serif !important;
        padding: 20px;
        margin: 0;
      }
    </style>
    ${htmlProva}
  `;

  cardProva.style.display = 'block';
  provaContainer.style.display = 'block';

  // Scroll into view
  cardProva.scrollIntoView({ behavior: 'smooth', block: 'start' });

  showResultado(`
    ✅ Prova gerada com sucesso.<br>
    <strong>Título:</strong> ${data?.titulo_prova || data?.titulo || payload.tituloprova || '—'}<br>
    <strong>Curso:</strong> ${data?.curso || payload.curso || '—'}<br>
    <strong>Questões:</strong> ${Array.isArray(data?.questoes) ? data.questoes.length : payload.quantidade}<br>
    <strong>IA:</strong> ${payload.ia}
  `);
}

/* ============================================================
   Core: Generate Exam
   ============================================================ */
async function gerarProva() {
  clearFeedback();

  // Reset result area
  const cardProva = elements.cardProva();
  const provaHtmlDiv = elements.provaHtmlDiv();
  const iframe = elements.iframe();

  cardProva.style.display = 'none';
  provaHtmlDiv.innerHTML = '';
  iframe.srcdoc = '';

  setLoadingState(true);
  elements.resultado().style.display = 'block';
  elements.resultado().textContent = 'Gerando prova...';

  const payload  = buildPayload();
  const formData = new FormData();
  formData.append('dados', JSON.stringify(payload));

  const fileInput = document.getElementById('apostila');
  const arquivo   = fileInput?.files?.[0];
  if (arquivo) formData.append('apostila', arquivo);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body:   formData,
    });

    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json')) {
      const preview = await response.text();
      throw new Error(
        `Servidor retornou ${response.status} (não-JSON). Trecho: ${preview.slice(0, 200)}`
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Servidor retornou ${response.status}. Mensagem: ${data?.message || data?.error || 'sem detalhes'}`
      );
    }

    const htmlProva = extractHtmlProva(data);
    renderProva(htmlProva, data, payload);

  } catch (error) {
    clearFeedback();
    showErro(error?.message ?? String(error));
  } finally {
    setLoadingState(false);
  }
}

/* ============================================================
   Export: PDF
   ============================================================ */
function baixarPDF() {
  const exportEl = document.getElementById('prova-html');

  if (!exportEl?.innerHTML.trim()) {
    alert('❌ Nenhuma prova gerada ainda.');
    return;
  }

  const tempContainer = document.createElement('div');
  tempContainer.style.cssText = 'background:#fff;color:#000;padding:20px;font-family:Arial,sans-serif;font-size:12pt;';
  tempContainer.innerHTML = exportEl.innerHTML;
  document.body.appendChild(tempContainer);

  const options = {
    margin:     10,
    filename:   'prova-masayoshi.pdf',
    image:      { type: 'jpeg', quality: 0.98 },
    html2canvas:{ scale: 2, useCORS: true },
    jsPDF:      { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  html2pdf()
    .set(options)
    .from(tempContainer)
    .save()
    .then(() => document.body.removeChild(tempContainer))
    .catch(() => document.body.removeChild(tempContainer));
}

/* ============================================================
   Export: Word (.docx)
   ============================================================ */
function baixarWord() {
  const exportEl = document.getElementById('prova-html');

  if (!exportEl?.innerHTML.trim()) {
    alert('❌ Nenhuma prova gerada ainda.');
    return;
  }

  if (!window.htmlDocx?.asBlob) {
    alert('❌ Biblioteca de exportação Word não carregou. Verifique a conexão.');
    return;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Prova Masayoshi</title>
      <style>body{font-family:Arial,sans-serif;font-size:12pt;margin:20px;}</style>
    </head>
    <body>${exportEl.innerHTML}</body>
    </html>
  `;

  const blob = window.htmlDocx.asBlob(fullHtml);
  const link = document.createElement('a');
  link.href     = URL.createObjectURL(blob);
  link.download = 'prova-masayoshi.docx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ============================================================
   Init
   ============================================================ */
function init() {
  initIaTiles();
  bindSwitch('usarapostila', 'sw-usarapostila');
  initDropzone();
  initProgressTracker();

  const form = document.getElementById('formProva');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      gerarProva();
    });
  }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
