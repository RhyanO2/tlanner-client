import { useMemo, useState } from 'react';
import { createBillingApi } from '../lib/api';

type PremiumPlan = {
  id: 'premium-brl' | 'premium-usd';
  title: string;
  subtitle: string;
  displayPrice: string;
  centsPrice: number;
  methods: Array<'PIX' | 'CARD'>;
  currency: 'BRL' | 'USD';
};

const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: 'premium-brl',
    title: 'Premium Brasil',
    subtitle: 'Pagamento em reais',
    displayPrice: 'R$ 6,99',
    centsPrice: 699,
    methods: ['PIX', 'CARD'],
    currency: 'BRL',
  },
  {
    id: 'premium-usd',
    title: 'Premium International',
    subtitle: 'Pagamento em dólar',
    displayPrice: 'US$ 1,49',
    centsPrice: 149,
    methods: ['CARD'],
    currency: 'USD',
  },
];

function sanitizeText(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(cellphone: string): boolean {
  const digits = cellphone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13;
}

function isValidTaxId(taxId: string): boolean {
  const digits = taxId.replace(/\D/g, '');
  return digits.length >= 11;
}

function extractCheckoutUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidateKeys = [
    'url',
    'checkoutUrl',
    'billingUrl',
    'invoiceUrl',
    'redirectUrl',
  ] as const;

  const source = payload as Record<string, unknown>;

  for (const key of candidateKeys) {
    const candidate = source[key];

    if (typeof candidate !== 'string') {
      continue;
    }

    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString();
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function PremiumBilling() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cellphone, setCellphone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submittingPlanId, setSubmittingPlanId] = useState<
    PremiumPlan['id'] | null
  >(null);

  const normalizedData = useMemo(
    () => ({
      name: sanitizeText(name),
      email: sanitizeText(email).toLowerCase(),
      cellphone: sanitizeText(cellphone),
      taxId: sanitizeText(taxId),
    }),
    [name, email, cellphone, taxId],
  );

  function validateForm(): string | null {
    if (normalizedData.name.length < 3) {
      return 'Enter a valid full name.';
    }
    if (!isValidEmail(normalizedData.email)) {
      return 'Enter a valid email address.';
    }
    if (!isValidPhone(normalizedData.cellphone)) {
      return 'Enter a valid cellphone with country/area code.';
    }
    if (!isValidTaxId(normalizedData.taxId)) {
      return 'Enter a valid document (CPF/Tax ID).';
    }
    return null;
  }

  async function handleCheckout(plan: PremiumPlan) {
    const validationError = validateForm();
    if (validationError) {
      setSuccess(null);
      setError(validationError);
      return;
    }

    setSubmittingPlanId(plan.id);
    setError(null);
    setSuccess(null);

    try {
      const origin = window.location.origin;
      const returnUrl = new URL('/premium', origin).toString();
      const completionUrl = new URL('/dashboard', origin).toString();

      const response = await createBillingApi({
        frequency: 'ONE_TIME',
        methods: plan.methods,
        products: [
          {
            externalId: plan.id,
            name: 'Tlanner Premium Plan',
            description: `${plan.currency} one-time premium activation`,
            quantity: 1,
            price: plan.centsPrice,
          },
        ],
        returnUrl,
        completionUrl,
        customer: {
          name: normalizedData.name,
          cellphone: normalizedData.cellphone,
          email: normalizedData.email,
          taxId: normalizedData.taxId,
        },
        allowCoupons: false,
        metadata: {
          planId: plan.id,
          currency: plan.currency,
        },
      });

      const checkoutUrl = extractCheckoutUrl(response);

      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }

      setSuccess(
        'Billing created successfully. Finish payment in the provider page.',
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not create billing now.',
      );
    } finally {
      setSubmittingPlanId(null);
    }
  }

  return (
    <div className="container premium-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Premium Plan</h2>
          <p className="muted">
            Unlock premium access with a one-time payment.
          </p>
        </div>
      </div>

      <section
        className="card premium-intro"
        aria-label="Premium plan benefits"
      >
        <div className="card-title">What you get</div>
        <ul className="landing-list premium-benefits">
          <li>Priority access to premium features</li>
          <li>Faster updates for productivity tools</li>
          <li>Support the project with a low one-time fee</li>
        </ul>
      </section>

      <section className="card premium-form-card" aria-label="Customer info">
        <div className="card-title">Billing details</div>
        <div className="premium-form-grid">
          <label className="field">
            <span className="field-label">Full name</span>
            <input
              className="input"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              autoComplete="name"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Cellphone</span>
            <input
              className="input"
              type="tel"
              value={cellphone}
              onChange={(event) => setCellphone(event.target.value)}
              maxLength={24}
              autoComplete="tel"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">CPF / Tax ID</span>
            <input
              className="input"
              type="text"
              value={taxId}
              onChange={(event) => setTaxId(event.target.value)}
              maxLength={24}
              autoComplete="off"
              required
            />
          </label>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}
      {success ? <div className="card premium-success">{success}</div> : null}

      <section className="premium-plans" aria-label="Premium payment options">
        {PREMIUM_PLANS.map((plan) => {
          const isSubmitting = submittingPlanId === plan.id;

          return (
            <article className="task-card premium-option-card" key={plan.id}>
              <div className="task-card-top">
                <div>
                  <div className="task-card-title">{plan.title}</div>
                  <div className="task-card-desc">{plan.subtitle}</div>
                </div>
                <span className="badge">{plan.displayPrice}</span>
              </div>

              <div className="premium-option-footer">
                <span className="muted">
                  Methods: {plan.methods.join(', ')}
                </span>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => {
                    void handleCheckout(plan);
                  }}
                  disabled={Boolean(submittingPlanId)}
                >
                  {isSubmitting
                    ? 'Creating checkout…'
                    : `Pay ${plan.displayPrice}`}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
