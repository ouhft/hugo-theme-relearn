/**
 * Hugo Relearn theme search adapter for Pagefind
 * https://pagefind.app
 * MIT license
 */

(function () {
  'use strict';

  let pagefind = null;

  async function init() {
    try {
      const config = JSON.parse(document.querySelector('#R-search-pagefind-config').textContent);
      pagefind = await import(config.apiUrl);
      await pagefind.options({ baseUrl: config.baseUrl });
      for (const index of config.mergeIndex) {
        const { bundlePath, ...options } = index;
        await pagefind.mergeIndex(bundlePath, options);
      }

      window.relearn.isSearchEngineReady = true;
      window.relearn.executeInitialSearch();
    } catch (error) {
      console.warn('Pagefind not available. Run: hugo && npx pagefind --site public');
      console.error(error);
      window.relearn.isSearchEngineReady = true;
      window.relearn.executeInitialSearch();
    }
  }

  function stripMarkTags(html) {
    // Remove only <mark> tags but preserve their content and all other HTML
    return html.replace(/<\/?mark[^>]*>/gi, '');
  }

  async function search(term, maxResults = 10) {
    if (!pagefind || !term) {
      return [];
    }

    try {
      const searchResults = await pagefind.search(term);
      const resultLimit = document.documentElement.dataset.rOutputFormat === 'print' ? Infinity : maxResults;
      const limitedResults = searchResults.results.slice(0, resultLimit);

      // Load the full data for each result
      const results = await Promise.all(
        limitedResults.map(async (result) => {
          const data = await result.data();

          return {
            page: {
              uri: data.url,
              title: stripMarkTags(data.meta?.title || ''),
              breadcrumb: '',
              content: stripMarkTags(data.excerpt || data.content || ''),
              tags: data.meta?.tags || [],
            },
            matches: term.split(' ').filter((word) => word.length > 0),
          };
        })
      );

      return results;
    } catch (error) {
      console.error('Pagefind search error:', error);
      return [];
    }
  }

  // Export the adapter interface
  window.relearn = window.relearn ?? {};
  window.relearn.search = window.relearn.search ?? {};
  window.relearn.search.adapter = { init, search };
})();
