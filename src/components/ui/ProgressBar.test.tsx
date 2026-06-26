import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('affiche la largeur à 50% pour value=50', () => {
    const { container } = render(<ProgressBar value={50} />);
    // container > outer-wrapper > inner-bar
    const inner = container.querySelector('div > div > div') as HTMLElement;
    expect(inner.style.width).toBe('50%');
  });

  it('plafonne à 100% pour value=150', () => {
    const { container } = render(<ProgressBar value={150} />);
    const inner = container.querySelector('div > div > div') as HTMLElement;
    expect(inner.style.width).toBe('100%');
  });

  it('utilise la couleur personnalisée passée via color', () => {
    const { container } = render(<ProgressBar value={30} color="#FF0000" />);
    const inner = container.querySelector('div > div > div') as HTMLElement;
    expect(inner.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });
});
