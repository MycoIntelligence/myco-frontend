import unittest
from pathlib import Path
import re


class TestPricingPage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html_path = Path(__file__).parent / "pricing" / "index.html"
        cls.css_path = Path(__file__).parent / "static" / "css" / "pricing.css"
        cls.js_path = Path(__file__).parent / "static" / "js" / "pricing.js"
        cls.config_path = Path(__file__).parent / "static" / "js" / "pricing-config.js"

        with open(cls.html_path, "r", encoding="utf-8") as f:
            cls.html = f.read()

    def test_files_exist(self):
        self.assertTrue(self.html_path.exists(), "pricing/index.html must exist")
        self.assertTrue(self.css_path.exists(), "static/css/pricing.css must exist")
        self.assertTrue(self.js_path.exists(), "static/js/pricing.js must exist")
        self.assertTrue(self.config_path.exists(), "static/js/pricing-config.js must exist")

    def test_navigation(self):
        self.assertIn('aria-label="Main navigation"', self.html)
        self.assertIn('class="logo" href="/"', self.html)
        self.assertIn('href="/#overview">Overview</a>', self.html)
        self.assertIn('href="/#how">How it works</a>', self.html)
        self.assertIn('href="/#integrate">Integrate</a>', self.html)
        self.assertIn('href="/#security">Security</a>', self.html)
        self.assertIn('href="/pricing/" aria-current="page">Pricing</a>', self.html)
        self.assertIn('class="nav-action" href="#plans">Explore plans', self.html)

    def test_intro_heading_and_copy(self):
        self.assertIn('<p class="eyebrow">PRICING</p>', self.html)
        self.assertIn('<h1 id="pricing-title">Unlimited code review.<br><span>Pay per developer.</span></h1>', self.html)
        self.assertIn(
            '<p class="intro-copy">Review every pull request with Team. Add governance, deployment options and priority support with Enterprise.</p>',
            self.html
        )

    def test_billing_selector_and_trial_note(self):
        self.assertIn('<p>30-day trial. No credit card required.</p>', self.html)
        self.assertIn('name="billing" value="monthly" checked', self.html)
        self.assertIn('name="billing" value="annual"', self.html)
        self.assertIn('<small>Save 20%</small>', self.html)

    def test_llm_explainer(self):
        self.assertIn('<p><strong>Your subscription covers Myco.</strong> LLM usage is paid separately through your own API key.</p>', self.html)
        self.assertIn('<p class="trial-cost">LLM charges also apply during the free trial.</p>', self.html)

    def test_team_card(self):
        self.assertIn('<article class="plan team"', self.html)
        self.assertIn('<h2 id="team-title">Team</h2>', self.html)
        self.assertIn('<span id="team-price">$20</span><span class="price-unit">/ developer / month</span>', self.html)
        self.assertIn('<p id="billing-detail">Billed monthly.</p>', self.html)
        self.assertIn('<p class="plan-description">For engineering teams reviewing every pull request.</p>', self.html)
        self.assertIn('<h3>Included in Team</h3>', self.html)
        self.assertIn('<li>Full review and validation pipeline</li>', self.html)
        self.assertIn('<li>Unlimited reviews and repositories</li>', self.html)
        self.assertIn('<li>Dashboard and analytics</li>', self.html)
        self.assertIn('<li>Community and email support</li>', self.html)
        self.assertIn('Start 30-day free trial', self.html)
        self.assertIn('data-pricing-cta="trial"', self.html)
        self.assertIn('<p class="cta-note">No credit card. Start with a Myco introduction.</p>', self.html)

    def test_enterprise_card(self):
        self.assertIn('<article class="plan enterprise"', self.html)
        self.assertIn('<h2 id="enterprise-title">Enterprise</h2>', self.html)
        self.assertIn('<p class="custom-price">Custom pricing</p>', self.html)
        self.assertIn('<p>A plan tailored to your organization.</p>', self.html)
        self.assertIn('For organizations that need governance, custom deployment and dedicated support.', self.html)
        self.assertIn('<h3>Everything in Team, plus</h3>', self.html)
        self.assertIn('<li>Identity controls, governance and self-learning</li>', self.html)
        self.assertIn('<li>Custom connectors and deployment options</li>', self.html)
        self.assertIn('<li>Priority support and dedicated CSM</li>', self.html)
        self.assertIn('Talk to us', self.html)
        self.assertIn('data-pricing-cta="sales"', self.html)
        self.assertIn('<p class="cta-note">Discuss deployment, governance and support.</p>', self.html)

    def test_paid_seat_note(self):
        self.assertIn(
            '<p class="seat-note"><strong>Paid seats are admin-approved.</strong> Only developers whose PRs Myco reviews need a seat. Viewing findings is free.</p>',
            self.html
        )

    def test_comparison_section(self):
        self.assertIn('<section class="comparison"', self.html)
        self.assertIn('<h2 id="compare-title">Choose your level of control.</h2>', self.html)
        self.assertIn('Both plans include the complete review pipeline. Here’s what changes.', self.html)
        self.assertIn('PLAN COMPARISON', self.html)
        self.assertIn('Core review in both.<br>More control in Enterprise.', self.html)
        self.assertIn('<span id="comparison-price">$20 / developer / month</span>', self.html)
        self.assertIn('<small id="comparison-billing">Billed monthly</small>', self.html)

        # Governance
        self.assertIn('ACCESS &amp; OVERSIGHT', self.html)
        self.assertIn('<h3 id="group-governance">Governance</h3>', self.html)
        self.assertIn('Control who can access Myco, understand review activity and adapt to your team’s standards.', self.html)
        self.assertIn('SSO / SAML and audit logs', self.html)
        self.assertIn('Dashboard and analytics', self.html)
        self.assertIn('Advanced self-learning', self.html)

        # Deployment
        self.assertIn('INFRASTRUCTURE &amp; INTEGRATIONS', self.html)
        self.assertIn('<h3 id="group-deployment">Deployment</h3>', self.html)
        self.assertIn('Choose single-tenant SaaS or on-prem deployment, and connect the internal tools your team relies on.', self.html)
        self.assertIn('Custom connectors', self.html)
        self.assertIn('Single-tenant SaaS or on-prem deployment', self.html)

        # Support
        self.assertIn('SERVICE &amp; PARTNERSHIP', self.html)
        self.assertIn('<h3 id="group-support">Support</h3>', self.html)
        self.assertIn('Get community and email support in Team, or priority Slack support and a dedicated customer success manager in Enterprise.', self.html)
        self.assertIn('Support and account management', self.html)
        self.assertIn('Community and email support', self.html)
        self.assertIn('Priority Slack support and a dedicated customer success manager', self.html)

    def test_faq_section(self):
        self.assertIn('<h2 id="faq-title">Billing, trials and seats.</h2>', self.html)
        self.assertIn('<summary>Who needs a paid seat?</summary>', self.html)
        self.assertIn('<summary>What does the 30-day trial include?</summary>', self.html)
        self.assertIn('<summary>What happens after 30 days?</summary>', self.html)
        self.assertIn('<summary>How does annual billing work?</summary>', self.html)

    def test_footer(self):
        self.assertIn('Agentic intelligence for engineering.', self.html)
        self.assertIn('<a href="/">Overview</a>', self.html)
        self.assertIn('<a href="/#security">Security</a>', self.html)
        self.assertIn('© 2026 Myco', self.html)

    def test_js_pricing_toggle_script(self):
        with open(self.js_path, "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("team-price", js)
        self.assertIn("$16", js)
        self.assertIn("$20", js)
        self.assertIn("$192 per developer, billed yearly. Save 20%.", js)
        self.assertIn("comparison-price", js)
        self.assertIn("comparison-billing", js)
        self.assertIn("MYCO_PRICING_LINKS", js)


if __name__ == "__main__":
    unittest.main()
