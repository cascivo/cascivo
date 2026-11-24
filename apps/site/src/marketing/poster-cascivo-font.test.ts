import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./poster.css', import.meta.url), 'utf8');

describe('Cascivo Fonts headline casing', () => {
  const rule = css.match(/html:root\[data-font='cascivo'\]\s*:where\(([^)]*)\)\s*\{([^}]*)\}/);

  it('turns off uppercase on every display headline selector', () => {
    expect(rule).not.toBeNull();
    const [, selectors, body] = rule as RegExpMatchArray;
    for (const s of ['.pg-display', '.cta-band h2', '.proof-hero h1', '.doc-head h1']) {
      expect(selectors).toContain(s);
    }
    expect(body).toMatch(/text-transform:\s*none/);
  });

  it('keeps eyebrows out of the sentence-case rule', () => {
    expect(rule?.[1]).not.toMatch(/eyebrow/);
  });
});
