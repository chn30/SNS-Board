import { describe, it, expect } from 'vitest';

describe('Project Configuration', () => {
  it('should have .env file with DATABASE_URL', async () => {
    const fs = await import('fs');
    const envContent = fs.readFileSync('.env', 'utf-8');
    expect(envContent).toContain('DATABASE_URL=postgresql://');
    expect(envContent).toContain('NEXTAUTH_SECRET=');
  });

  it('should have Next.js config file importable', async () => {
    const config = await import('../../next.config');
    expect(config).toBeDefined();
  });

  it('should have Tailwind config with design tokens', async () => {
    const config = await import('../../tailwind.config');
    const theme = config.default.theme?.extend;
    expect(theme?.colors?.background).toBe('#05050a');
    expect(theme?.colors?.primary).toBe('#8b5cf6');
    expect(theme?.colors?.['primary-pink']).toBe('#ec4899');
    expect(theme?.colors?.accent).toBe('#a78bfa');
    expect(theme?.colors?.['text-primary']).toBe('#e2e8f0');
    expect(theme?.colors?.['text-secondary']).toBe('#8892b0');
    expect(theme?.colors?.hot).toBe('#f87171');
    expect(theme?.colors?.success).toBe('#34d399');
    expect(theme?.colors?.warning).toBe('#fbbf24');
  });

  it('should have correct font family configured', async () => {
    const config = await import('../../tailwind.config');
    const fontFamily = config.default.theme?.extend?.fontFamily;
    expect(fontFamily?.sans).toContain('Inter');
  });
});
