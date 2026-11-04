(() => {
  const price = document.getElementById('team-price');
  const detail = document.getElementById('billing-detail');
  document.querySelectorAll('input[name="billing"]').forEach(input => {
    input.addEventListener('change', () => {
      const annual = input.value === 'annual';
      price.textContent = annual ? '$16' : '$20';
      detail.textContent = annual ? '$192 per developer, billed yearly. Save 20%.' : 'Billed monthly.';
      document.getElementById('comparison-price').textContent = annual ? '$16 / developer / month' : '$20 / developer / month';
      document.getElementById('comparison-billing').textContent = annual ? '$192 per developer, billed yearly' : 'Billed monthly';
    });
  });
  const links = window.MYCO_PRICING_LINKS || {};
  document.querySelectorAll('[data-pricing-cta]').forEach(link => {
    const value = links[link.dataset.pricingCta === 'trial' ? 'trialUrl' : 'salesUrl'];
    if (!value) return;
    try {
      const url = new URL(value, window.location.origin);
      if (!['https:', 'mailto:'].includes(url.protocol)) return;
      link.href = url.href;
      link.removeAttribute('aria-disabled');
    } catch { /* Unconfigured destinations remain inactive in the local review. */ }
  });
})();
