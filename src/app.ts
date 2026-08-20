import logoUrl from './assets/nbb-logo-en.svg';
import qrCodeSvg from './assets/workshop-url-qr.svg?raw';
import { config } from './data';
import {
  advanceDeckOffset,
  buildAnglePrompt,
  buildFeaturePrompt,
  buildStarterPrompt,
  filterIdeas,
  pickRandomIdea,
  SECOND_ACT_VISIBLE_COUNT,
  shuffleWithSeed,
  visibleDeckItems,
} from './prompt-utils';
import {
  readPersistedState,
  resetPersistedState,
  savePersistedState,
  type StorageLike,
} from './persistence';
import type { AppIdea, InterestingPrompt, PromptEntry, WorkshopState, WorkshopStep } from './model';

const stepOrder: readonly WorkshopStep[] = ['intro', 'choose', 'extend'];
const stepLabels: Record<WorkshopStep, string> = {
  intro: 'Start here',
  choose: 'Choose an app',
  extend: 'Make it yours',
};

const workshopUrl = 'https://nationalbankbelgium.github.io/ai-dev-workshop-2026-09/';

function createAngleSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) || 1;
}

interface FocusRequest {
  selector: string;
  cursorAtEnd?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getBrowserStorage(): StorageLike | undefined {
  try {
    const storage = window.localStorage;
    storage.getItem('__do_all_learning_storage_check__');
    return storage;
  } catch {
    return undefined;
  }
}

export class WorkshopApp {
  private readonly root: HTMLElement;
  private readonly storage: StorageLike | undefined;
  private readonly ideaIds: ReadonlySet<string>;
  private state: WorkshopState;
  private searchQuery = '';
  private showAllIdeas = false;

  public constructor(root: HTMLElement) {
    this.root = root;
    this.storage = getBrowserStorage();
    this.ideaIds = new Set(config.ideas.map((idea) => idea.id));
    this.state = { ...readPersistedState(this.storage, this.ideaIds), angleOffset: createAngleSeed() };
    this.root.addEventListener('click', this.handleClick);
    this.root.addEventListener('input', this.handleInput);
    window.addEventListener('hashchange', this.handleHashChange);
  }

  public start(): void {
    this.render();
  }

  private get selectedIdea(): AppIdea | null {
    if (!this.state.selectedIdeaId) {
      return null;
    }
    return config.ideas.find((idea) => idea.id === this.state.selectedIdeaId) ?? null;
  }

  private canNavigateTo(step: WorkshopStep): boolean {
    if (step === 'intro') {
      return true;
    }
    if (step === 'choose') {
      return this.state.step !== 'intro';
    }
    return this.state.selectedIdeaId !== null;
  }

  private updateState(nextState: WorkshopState, focusRequest?: FocusRequest): void {
    this.state = nextState;
    savePersistedState(this.storage, this.state);
    this.render(focusRequest);
  }

  private render(focusRequest?: FocusRequest): void {
    const content = this.isQrView() ? this.renderQrView() : this.renderStep();
    this.root.innerHTML = `
      <div class="app-shell">
        ${this.renderHeader()}
        <main id="main-content" class="main-content" tabindex="-1">
          ${content}
        </main>
        <footer class="site-footer">
          <span>AI development workshop · National Bank of Belgium · September 2026</span>
        </footer>
        <div id="copy-status" class="copy-status" role="status" aria-live="polite"></div>
      </div>
    `;

    if (focusRequest) {
      const focusTarget = this.root.querySelector<HTMLElement>(focusRequest.selector);
      focusTarget?.focus();
      if (focusRequest.cursorAtEnd && focusTarget instanceof HTMLInputElement) {
        const cursorPosition = focusTarget.value.length;
        focusTarget.setSelectionRange(cursorPosition, cursorPosition);
      }
    }
  }

  private isQrView(): boolean {
    return window.location.hash === '#qr-code';
  }

  private renderHeader(): string {
    const isQrView = this.isQrView();
    const currentStepIndex = stepOrder.indexOf(this.state.step);
    const backButton = isQrView
      ? '<a class="header-back" href="#main-content" aria-label="Back to workshop"><span aria-hidden="true">←</span><span class="action-text action-text-wide" aria-hidden="true">Back to workshop</span><span class="action-text action-text-compact" aria-hidden="true">Back</span></a>'
      : this.state.step === 'intro'
        ? ''
        : '<button type="button" class="header-back" data-action="back" aria-label="Back"><span aria-hidden="true">←</span><span class="action-text action-text-wide" aria-hidden="true">Back</span><span class="action-text action-text-compact" aria-hidden="true">Back</span></button>';

    const steps = stepOrder.map((step, index) => {
      const isCurrent = step === this.state.step;
      const isComplete = index < currentStepIndex;
      const isEnabled = this.canNavigateTo(step);
      const currentAttribute = isCurrent ? ' aria-current="step"' : '';
      const stateClass = isCurrent ? 'is-current' : isComplete ? 'is-complete' : 'is-locked';
      const disabledAttribute = isEnabled ? '' : ' disabled';
      return `
        <button type="button" class="step-link ${stateClass}" data-action="step" data-step="${step}"${currentAttribute}${disabledAttribute}>
          <span class="step-number">${String(index + 1).padStart(2, '0')}</span>
          <span class="step-label">${stepLabels[step]}</span>
        </button>
      `;
    }).join('<span class="step-connector" aria-hidden="true"></span>');

    return `
      <header class="site-header">
        <div class="header-topline">
          <a class="brand" href="#main-content" aria-label="National Bank of Belgium · go to the workshop">
            <span class="brand-logo"><img src="${escapeHtml(logoUrl)}" alt="National Bank of Belgium" width="148" height="45" /></span>
            <span class="brand-divider" aria-hidden="true"></span>
            <span class="brand-workshop">AI development<br />workshop</span>
          </a>
          <div class="header-actions">
            ${backButton}
            ${isQrView ? '' : '<a class="qr-link" href="#qr-code" aria-label="Display QR + instructions"><span aria-hidden="true">▦</span><span class="action-text action-text-wide" aria-hidden="true">Display QR + instructions</span><span class="action-text action-text-compact" aria-hidden="true">QR + guide</span></a>'}
            <button type="button" class="reset-button" data-action="reset" aria-label="Reset workshop"><span aria-hidden="true">↺</span><span class="action-text action-text-wide" aria-hidden="true">Reset workshop</span><span class="action-text action-text-compact" aria-hidden="true">Reset</span></button>
          </div>
        </div>
        ${isQrView ? '' : `<nav class="stepper" aria-label="Workshop progress">${steps}</nav>`}
      </header>
    `;
  }

  private renderQrView(): string {
    return `
      <section id="qr-code" class="step-panel qr-panel" aria-labelledby="qr-title">
        <div class="qr-copy">
          <span class="eyebrow">SHARE THE WORKSHOP</span>
          <h1 id="qr-title">Scan to start.</h1>
          <p class="qr-lead">Put this page on a shared screen. Everyone can scan the code to open the workshop on their own device.</p>
          <section class="qr-instructions" aria-labelledby="approach-title">
            <h2 id="approach-title">Recommended approach</h2>
            <ol>
              <li>Start by choosing an application to build.</li>
              <li>Create a folder on your machine; that's where you will build the application.</li>
              <li>Open the folder you've created with Visual Studio Code.</li>
              <li>Those who prefer the command line may also choose to use the GitHub Copilot CLI.</li>
              <li>Start a GitHub Copilot conversation.</li>
              <li>Build a first version of the application, respecting the constraints (if any).</li>
              <li>Open it and test it.</li>
              <li>Refresh the page after each round to check the results.</li>
              <li>Make it evolve, be creative, have fun with it!</li>
            </ol>
          </section>
          <div class="qr-url-block"><span class="eyebrow">WORKSHOP URL</span><a href="${workshopUrl}" target="_blank" rel="noreferrer">${workshopUrl}</a></div>
          <a class="primary-button" href="#main-content">Back to workshop <span aria-hidden="true">→</span></a>
        </div>
        <div class="qr-card" role="img" aria-label="QR code linking to the AI development workshop">${qrCodeSvg}</div>
      </section>
    `;
  }

  private renderStep(): string {
    switch (this.state.step) {
      case 'intro':
        return this.renderIntroStep();
      case 'choose':
        return this.renderChooseStep();
      case 'extend':
        return this.renderExtendStep();
    }
  }

  private renderIntroStep(): string {
    return `
      <section class="step-panel intro-panel" aria-labelledby="intro-title">
        <div class="intro-copy">
          <span class="eyebrow">STEP 1 · START HERE</span>
          <h1 id="intro-title">Build a small idea.<br /><em>Then make it yours.</em></h1>
          <p class="intro-lead">Your group of five will turn one playful app idea into a working prototype with an AI Development tool: GitHub Copilot. Start small, see what happens, and keep improving it together.</p>
          <button type="button" class="primary-button" data-action="continue-choose">Choose an app idea <span aria-hidden="true">→</span></button>
        </div>
        <div class="intro-aside" aria-label="Workshop essentials">
          <div class="aside-note">
            <span class="aside-note-mark">5</span>
            <div><strong>Five people, one shared build</strong><p>There is no required way to work. Share prompting, testing, design, and presenting however your group likes.</p></div>
          </div>
          <div class="aside-note">
            <span class="aside-note-mark">AI</span>
            <div><strong>Use Copilot as a teammate</strong><p>Give it the starter prompt, run the app, then ask for one focused change at a time.</p></div>
          </div>
          <div class="aside-note">
            <span class="aside-note-mark">↗</span>
            <div><strong>Build, test, evolve</strong><p>It does not need to be production-ready. Your best next step is the one you can see working.</p></div>
          </div>
        </div>
        <div class="intro-sequence" aria-label="How the workshop works">
          <article><span>01</span><h2>Pick a starting point</h2><p>Choose an idea that gives your group a clear first version.</p></article>
          <article><span>02</span><h2>Make it real</h2><p>Paste the starter prompt and inspect what the AI creates.</p></article>
          <article><span>03</span><h2>Give it a second act</h2><p>Choose a feature or a new angle and see how far you can take it.</p></article>
        </div>
      </section>
    `;
  }

  private renderChooseStep(): string {
    const selected = this.selectedIdea;
    const filteredIdeas = filterIdeas(config.ideas, this.searchQuery);
    const visibleIdeas = this.showAllIdeas || this.searchQuery.trim()
      ? filteredIdeas
      : filteredIdeas.slice(0, 12);
    const hasMoreIdeas = !this.searchQuery.trim() && filteredIdeas.length > visibleIdeas.length;

    return `
      <section class="step-panel choose-panel" aria-labelledby="choose-title">
        <div class="section-heading split-heading">
          <div><span class="eyebrow">STEP 2 · CHOOSE AN APP</span><h1 id="choose-title">Find a spark for your group.</h1><p>We have <strong>${config.ideas.length} ideas</strong> to get you moving. A random starting point is already waiting for you.</p></div>
          <span class="collection-count" aria-label="${config.ideas.length} app ideas"><strong>${config.ideas.length}</strong><span>app ideas</span></span>
        </div>
        ${selected ? this.renderProposedIdea(selected) : this.renderNoIdeaState()}
        <div class="browse-section">
          <div class="browse-heading"><div><h2>Browse the collection</h2><p>Search by title or by what the first version should do.</p></div><label class="search-box"><span class="search-icon" aria-hidden="true">⌕</span><span class="sr-only">Search app ideas</span><input type="search" data-search value="${escapeHtml(this.searchQuery)}" placeholder="Try “music”, “map”, or “timer”" autocomplete="off" /></label></div>
          <div id="idea-results" class="idea-results" aria-live="polite">
            ${visibleIdeas.length > 0 ? visibleIdeas.map((idea) => this.renderIdeaResult(idea, selected?.id === idea.id)).join('') : '<div class="empty-state"><strong>No ideas found.</strong><span>Try a broader search, or clear the search box.</span></div>'}
          </div>
          ${hasMoreIdeas || this.showAllIdeas ? `<button type="button" class="text-button browse-more" data-action="toggle-ideas">${this.showAllIdeas ? 'Show fewer ideas' : `Browse all ${config.ideas.length} ideas`} <span aria-hidden="true">${this.showAllIdeas ? '↑' : '↓'}</span></button>` : ''}
        </div>
      </section>
    `;
  }

  private renderProposedIdea(idea: AppIdea): string {
    return `
      <article class="proposed-idea" aria-labelledby="proposed-idea-title">
        <div class="proposed-topline"><span class="eyebrow">PROPOSED FOR YOUR GROUP</span><span class="idea-id">#${escapeHtml(idea.id)}</span></div>
        <div class="proposed-content"><div><h2 id="proposed-idea-title">${escapeHtml(idea.title)}</h2><p>${escapeHtml(idea.description)}</p></div><div class="proposed-actions"><button type="button" class="secondary-button" data-action="surprise"><span aria-hidden="true">↻</span> Surprise me</button><button type="button" class="primary-button small-button" data-action="continue-extend">Use this idea <span aria-hidden="true">→</span></button></div></div>
        <div class="idea-summary"><div><span>First version</span><ul>${idea.features.slice(0, 3).map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}</ul></div><div><span>Keep in mind</span><p>${escapeHtml(idea.constraints)}</p></div></div>
      </article>
    `;
  }

  private renderNoIdeaState(): string {
    return '<div class="empty-state no-idea-state"><strong>Choose an idea to continue.</strong><span>Pick a result below and the starter prompt will be ready for you.</span></div>';
  }

  private renderIdeaResult(idea: AppIdea, isSelected: boolean): string {
    return `
      <button type="button" class="idea-result${isSelected ? ' is-selected' : ''}" data-select-idea="${escapeHtml(idea.id)}" aria-pressed="${isSelected ? 'true' : 'false'}">
        <span class="result-id">#${escapeHtml(idea.id)}</span><span class="result-copy"><strong>${escapeHtml(idea.title)}</strong><span>${escapeHtml(idea.description)}</span></span><span class="result-arrow" aria-hidden="true">→</span>
      </button>
    `;
  }

  private renderExtendStep(): string {
    const idea = this.selectedIdea;
    if (!idea) {
      return `
        <section class="step-panel error-panel" aria-labelledby="error-title"><span class="eyebrow">CHOOSE AN APP FIRST</span><h1 id="error-title">Your idea is waiting.</h1><p>The saved selection is no longer available. Return to the collection and choose a new starting point.</p><button type="button" class="primary-button" data-action="step" data-step="choose">Back to app ideas <span aria-hidden="true">→</span></button></section>
      `;
    }

    const featureEntries = this.showAllFeatures(idea)
      ? idea.additionalFeatures.map((feature, index) => ({ feature, index }))
      : visibleDeckItems(idea.additionalFeatures.map((feature, index) => ({ feature, index })), this.state.secondActOffset, SECOND_ACT_VISIBLE_COUNT);
    const angleEntries = shuffleWithSeed(
      config.interestingPrompts.map((prompt, index) => ({ prompt, index })),
      this.state.angleOffset,
    );

    return `
      <section class="step-panel extend-panel" aria-labelledby="extend-title">
        <div class="selected-app-header"><div><span class="eyebrow">STEP 3 · MAKE IT YOURS · IDEA #${escapeHtml(idea.id)}</span><h1 id="extend-title">${escapeHtml(idea.title)}</h1><p>${escapeHtml(idea.description)}</p></div><button type="button" class="outline-button" data-action="step" data-step="choose"><span aria-hidden="true">←</span> Change idea</button></div>
        <section class="starter-section" aria-labelledby="starter-title"><div class="section-heading compact-heading"><div><span class="eyebrow">YOUR FIRST MOVE</span><h2 id="starter-title">Start with a clear prompt.</h2><p>Paste this into GitHub Copilot. Then open the result and test the first version as a group.</p></div><span class="prompt-type">STARTER PROMPT</span></div><div class="starter-card"><pre>${escapeHtml(buildStarterPrompt(idea))}</pre><button type="button" class="copy-button copy-button-primary" data-copy-starter><span aria-hidden="true">▣</span> Copy starter prompt</button></div></section>
        <div class="prompt-decks">
          <section class="deck-section second-act-section" aria-labelledby="second-act-title"><div class="deck-heading"><div><span class="eyebrow">BUILD ON IT</span><h2 id="second-act-title">Give your idea a second act.</h2><p>When the first version works, choose a focused next feature. Each card is ready to copy as a follow-up prompt.</p></div><button type="button" class="secondary-button" data-action="rotate-feature"><span aria-hidden="true">↻</span> Show different ideas</button></div><div class="deck-meta"><span>${this.showAllFeatures(idea) ? 'All 10 ideas shown' : `Showing ${featureEntries.length} of ${idea.additionalFeatures.length}`}</span><button type="button" class="text-button" data-action="toggle-features">${this.showAllFeatures(idea) ? 'Show a focused set' : 'See all 10'} <span aria-hidden="true">${this.showAllFeatures(idea) ? '↑' : '↓'}</span></button></div><div class="feature-grid">${featureEntries.map((entry, index) => this.renderFeatureCard(entry, index)).join('')}</div></section>
          <section class="deck-section angle-section" aria-labelledby="angle-title"><div class="deck-heading"><div><span class="eyebrow">OPEN IT UP</span><h2 id="angle-title">Try a different angle.</h2><p>Shuffle all ten workshop prompts to get a fresh mix. Every option is equally available to copy.</p></div><button type="button" class="secondary-button" data-action="rotate-angle"><span aria-hidden="true">↻</span> Shuffle options</button></div><div class="angle-list-heading"><span>All 10 interesting prompts</span><span>Copy any one</span></div><div class="angle-list" aria-live="polite">${angleEntries.map(({ prompt, index }, displayIndex) => this.renderAngleRow(prompt, index, displayIndex)).join('')}</div></section>
        </div>
      </section>
    `;
  }

  private showAllFeatures(idea: AppIdea): boolean {
    return this.showAllFeaturesForIdeaId === idea.id;
  }

  private showAllFeaturesForIdeaId: string | null = null;

  private renderFeatureCard(entry: { feature: PromptEntry; index: number }, displayIndex: number): string {
    return `<article class="feature-card"><span class="feature-number">${String(displayIndex + 1).padStart(2, '0')}</span><h3>${escapeHtml(entry.feature.title)}</h3><p>${escapeHtml(entry.feature.prompt)}</p><button type="button" class="copy-button" data-copy-feature="${entry.index}"><span aria-hidden="true">▣</span> Copy prompt</button></article>`;
  }

  private renderAngleRow(prompt: InterestingPrompt, sourceIndex: number, displayIndex: number): string {
    return `<article class="angle-row"><span class="angle-row-number">${String(displayIndex + 1).padStart(2, '0')}</span><div><h3>${escapeHtml(prompt.title)}</h3><p>${escapeHtml(prompt.prompt)}</p></div><button type="button" class="copy-button" data-copy-angle="${sourceIndex}"><span aria-hidden="true">▣</span><span class="copy-label">Copy</span></button></article>`;
  }

  private handleInput = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.matches('[data-search]')) {
      return;
    }
    this.searchQuery = target.value;
    this.showAllIdeas = false;
    this.render({ selector: '[data-search]', cursorAtEnd: true });
  };

  private handleHashChange = (): void => {
    this.render();
  };

  private handleClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const selectButton = target.closest<HTMLElement>('[data-select-idea]');
    if (selectButton) {
      const ideaId = selectButton.dataset.selectIdea;
      const idea = ideaId ? config.ideas.find((candidate) => candidate.id === ideaId) : undefined;
      if (idea) {
        this.showAllFeaturesForIdeaId = null;
        this.updateState({ ...this.state, selectedIdeaId: idea.id, secondActOffset: 0, angleOffset: createAngleSeed() });
      }
      return;
    }

    const copyStarterButton = target.closest<HTMLElement>('[data-copy-starter]');
    if (copyStarterButton) {
      const idea = this.selectedIdea;
      if (idea) {
        void this.copyPrompt(buildStarterPrompt(idea), 'Starter prompt', copyStarterButton);
      }
      return;
    }

    const copyFeatureButton = target.closest<HTMLElement>('[data-copy-feature]');
    if (copyFeatureButton) {
      const idea = this.selectedIdea;
      const featureIndex = Number(copyFeatureButton.dataset.copyFeature);
      const feature = idea?.additionalFeatures[featureIndex];
      if (idea && feature) {
        void this.copyPrompt(buildFeaturePrompt(idea, feature), 'Follow-up prompt', copyFeatureButton);
      }
      return;
    }

    const copyAngleButton = target.closest<HTMLElement>('[data-copy-angle]');
    if (copyAngleButton) {
      const idea = this.selectedIdea;
      const angleIndex = Number(copyAngleButton.dataset.copyAngle);
      const prompt = config.interestingPrompts[angleIndex];
      if (idea && prompt) {
        void this.copyPrompt(buildAnglePrompt(idea, prompt), 'Angle prompt', copyAngleButton);
      }
      return;
    }

    const actionButton = target.closest<HTMLElement>('[data-action]');
    if (!actionButton || actionButton.hasAttribute('disabled')) {
      return;
    }
    const action = actionButton.dataset.action;
    switch (action) {
      case 'continue-choose':
        this.goToChooseStep();
        break;
      case 'continue-extend':
        this.goToExtendStep();
        break;
      case 'surprise':
        this.chooseRandomIdea();
        break;
      case 'toggle-ideas':
        this.showAllIdeas = !this.showAllIdeas;
        this.render({ selector: '[data-action="toggle-ideas"]' });
        break;
      case 'toggle-features':
        this.showAllFeaturesForIdeaId = this.showAllFeaturesForIdeaId ? null : this.state.selectedIdeaId;
        this.render({ selector: '[data-action="toggle-features"]' });
        break;
      case 'rotate-feature':
        this.rotateFeatures();
        break;
      case 'rotate-angle':
        this.rotateAngle();
        break;
      case 'step':
        this.goToStep(actionButton.dataset.step as WorkshopStep | undefined);
        break;
      case 'back':
        this.goBack();
        break;
      case 'reset':
        this.reset();
        break;
    }
  };

  private goToChooseStep(): void {
    const selectedIdea = this.selectedIdea ?? pickRandomIdea(config.ideas, null);
    this.updateState({
      ...this.state,
      step: 'choose',
      selectedIdeaId: selectedIdea?.id ?? null,
      secondActOffset: 0,
      angleOffset: createAngleSeed(),
    });
  }

  private goToExtendStep(): void {
    if (!this.state.selectedIdeaId) {
      return;
    }
    this.updateState({ ...this.state, step: 'extend' });
  }

  private goToStep(step: WorkshopStep | undefined): void {
    if (!step || !this.canNavigateTo(step)) {
      return;
    }
    this.updateState({ ...this.state, step });
  }

  private goBack(): void {
    const currentIndex = stepOrder.indexOf(this.state.step);
    const previousStep = currentIndex > 0 ? stepOrder[currentIndex - 1] : undefined;
    if (previousStep) {
      this.updateState({ ...this.state, step: previousStep });
    }
  }

  private chooseRandomIdea(): void {
    const nextIdea = pickRandomIdea(config.ideas, this.state.selectedIdeaId);
    if (!nextIdea) {
      return;
    }
    this.showAllFeaturesForIdeaId = null;
    this.updateState({ ...this.state, selectedIdeaId: nextIdea.id, secondActOffset: 0, angleOffset: createAngleSeed() });
  }

  private rotateFeatures(): void {
    const idea = this.selectedIdea;
    if (!idea) {
      return;
    }
    this.showAllFeaturesForIdeaId = null;
    this.updateState(
      { ...this.state, secondActOffset: advanceDeckOffset(this.state.secondActOffset, idea.additionalFeatures.length, SECOND_ACT_VISIBLE_COUNT) },
      { selector: '[data-action="rotate-feature"]' },
    );
  }

  private rotateAngle(): void {
    let nextSeed = createAngleSeed();
    if (nextSeed === this.state.angleOffset) {
      nextSeed = nextSeed === 0xffffffff ? 1 : nextSeed + 1;
    }
    this.updateState(
      { ...this.state, angleOffset: nextSeed },
      { selector: '[data-action="rotate-angle"]' },
    );
  }

  private reset(): void {
    if (this.isQrView()) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
    this.state = resetPersistedState(this.storage);
    this.searchQuery = '';
    this.showAllIdeas = false;
    this.showAllFeaturesForIdeaId = null;
    this.render();
    this.setStatus('Workshop reset. You are back at the start.');
  }

  private async copyPrompt(text: string, label: string, button: HTMLElement): Promise<void> {
    let copied = false;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.append(textarea);
      textarea.select();
      try {
        copied = document.execCommand('copy');
      } catch {
        copied = false;
      }
      textarea.remove();
    }

    if (copied) {
      const originalLabel = button.dataset.originalLabel ?? button.textContent ?? 'Copy prompt';
      button.dataset.originalLabel = originalLabel;
      button.classList.add('is-copied');
      button.textContent = '✓ Copied';
      this.setStatus(`${label} copied to the clipboard.`);
      window.setTimeout(() => {
        button.classList.remove('is-copied');
        button.textContent = originalLabel;
      }, 1800);
    } else {
      this.setStatus('Copy was blocked by the browser. Select the prompt text and copy it manually.');
    }
  }

  private setStatus(message: string): void {
    const status = this.root.querySelector<HTMLElement>('#copy-status');
    if (status) {
      status.textContent = message;
    }
  }
}
