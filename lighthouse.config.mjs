export default {
  port: 4174,
  runs: 3,
  outputDir: 'reports/lighthouse',
  formFactors: ['mobile', 'desktop'],
  pages: [
    { name: 'inicio', path: '/' },
    { name: 'detalhe', path: '/nfts/emerald-ape-042' },
  ],
  categories: ['performance', 'accessibility', 'best-practices', 'seo'],
  budgets: {
    mobile: { lcp: 2500, cls: 0.1, tbt: 200 },
    desktop: { lcp: 2500, cls: 0.1, tbt: 200 },
  },
}
