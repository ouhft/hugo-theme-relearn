(function () {
  'use strict';

  async function init() {
    const config = JSON.parse(document.querySelector('#R-search-pagefind-config').textContent);
    await import(config.componentUiUrl);

    const pagefindComponents = window.PagefindComponents;
    if (!pagefindComponents) {
      console.error('Pagefind Component UI configuration is unavailable.');
      return;
    }
    pagefindComponents.configureInstance('default', {
      bundlePath: config.bundlePath,
      baseUrl: config.baseUrl,
      mergeIndex: config.mergeIndex,
    });

    const container = document.querySelector('#R-pagefind-search');
    if (!container) {
      console.error('Pagefind search container was not found.');
      return;
    }
    const inputComponent = document.createElement('pagefind-input');
    inputComponent.id = 'R-pagefind-input';
    const summary = document.createElement('pagefind-summary');
    const results = document.createElement('pagefind-results');
    results.setAttribute('hide-sub-results', '');
    results.setAttribute('show-images', 'false');
    container.append(inputComponent, summary, results);

    await customElements.whenDefined('pagefind-input');

    const input = inputComponent.querySelector('input[type="search"]');
    if (!input) {
      console.error('Pagefind search input was not initialized.');
      return;
    }

    let restoring = false;
    let historyEntryOpen = false;
    let editTimeout;

    function updatePrintLink(term) {
      const printLink = document.querySelector('.topbar-button-print a');
      if (!printLink) {
        return;
      }

      if (!config.printUrl) {
        console.error('Pagefind print URL is unavailable.');
        return;
      }

      const url = new URL(config.printUrl);
      url.searchParams.delete('search-by');
      if (term) {
        url.searchParams.set('search-by', term);
      }
      printLink.href = url.toString();
    }

    function updateHistory(term) {
      const url = new URL(window.location);
      if (term) {
        url.searchParams.set('search-by', term);
      } else {
        url.searchParams.delete('search-by');
      }
      if (url.href === window.location.href) {
        return;
      }

      const state = Object.assign({}, window.history.state || {});
      delete state.search;
      state.pagefindSearch = url.toString();
      const content = document.querySelector('#R-content-wrapper');
      if (content) {
        state.contentScrollTop = content.scrollTop;
      }

      if (historyEntryOpen) {
        window.history.replaceState(state, '', url);
      } else {
        window.history.pushState(state, '', url);
        historyEntryOpen = true;
      }

      window.clearTimeout(editTimeout);
      editTimeout = window.setTimeout(function () {
        historyEntryOpen = false;
      }, 500);
    }

    input.addEventListener('input', function () {
      if (restoring) {
        return;
      }
      updateHistory(input.value);
      updatePrintLink(input.value);
    });

    window.addEventListener('popstate', function () {
      window.clearTimeout(editTimeout);
      historyEntryOpen = false;
      const term = new URL(window.location).searchParams.get('search-by') || '';
      if (input.value !== term) {
        restoring = true;
        input.value = term;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        restoring = false;
      }
      updatePrintLink(term);
    });

    const initialTerm = new URL(window.location).searchParams.get('search-by') || '';
    input.value = initialTerm;
    updatePrintLink(initialTerm);
    if (initialTerm) {
      restoring = true;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      restoring = false;
    }
  }

  init().catch(function (error) {
    console.error('Unable to initialize the Pagefind search page.', error);
  });
})();
