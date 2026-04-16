import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Prisma Schema Validation', () => {
  it('should pass prisma validate without errors', () => {
    const result = execSync('npx prisma validate', {
      cwd: path.resolve(__dirname, '../..'),
      encoding: 'utf-8',
    });
    expect(result).toContain('valid');
  });

  it('should have all required models defined in schema.prisma', () => {
    const schema = fs.readFileSync(
      path.resolve(__dirname, '../../prisma/schema.prisma'),
      'utf-8',
    );
    const requiredModels = [
      'User',
      'Post',
      'Comment',
      'Like',
      'Report',
      'AdminLog',
    ];
    for (const model of requiredModels) {
      expect(schema).toContain(`model ${model} {`);
    }
  });

  it('should have all required enums defined in schema.prisma', () => {
    const schema = fs.readFileSync(
      path.resolve(__dirname, '../../prisma/schema.prisma'),
      'utf-8',
    );
    const requiredEnums = ['Role', 'Category', 'TargetType', 'ReportReason'];
    for (const e of requiredEnums) {
      expect(schema).toContain(`enum ${e} {`);
    }
  });

  it('should have unique constraints on Like and Report', () => {
    const schema = fs.readFileSync(
      path.resolve(__dirname, '../../prisma/schema.prisma'),
      'utf-8',
    );
    // Like has @@unique([userId, targetType, targetId])
    expect(schema).toMatch(/@@unique\(\[userId,\s*targetType,\s*targetId\]\)/);
    // Report has @@unique([reporterId, targetType, targetId])
    expect(schema).toMatch(
      /@@unique\(\[reporterId,\s*targetType,\s*targetId\]\)/,
    );
  });
});

describe('Prisma Singleton', () => {
  it('should export a prisma instance from lib/prisma.ts', async () => {
    const prismaModule = await import('../../src/lib/prisma');
    expect(prismaModule.prisma).toBeDefined();
    expect(typeof prismaModule.prisma).toBe('object');
  });

  it('should use singleton pattern with globalThis', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../src/lib/prisma.ts'),
      'utf-8',
    );
    expect(source).toContain('globalThis');
    expect(source).toContain('PrismaClient');
  });
});

describe('Project Configuration', () => {
  it('should not have type:commonjs in package.json', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8'),
    );
    expect(pkg.type).not.toBe('commonjs');
  });

  it('should have all required npm scripts', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8'),
    );
    expect(pkg.scripts.dev).toBe('next dev');
    expect(pkg.scripts.build).toBe('next build');
    expect(pkg.scripts.start).toBe('next start');
    expect(pkg.scripts.lint).toBe('next lint');
    expect(pkg.scripts.seed).toBeDefined();
  });

  it('should have prisma seed config in package.json', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8'),
    );
    expect(pkg.prisma).toBeDefined();
    expect(pkg.prisma.seed).toBeDefined();
    expect(pkg.prisma.seed).toContain('ts-node');
  });

  it('should have migration files in prisma/migrations/', () => {
    const migrationsDir = path.resolve(__dirname, '../../prisma/migrations');
    expect(fs.existsSync(migrationsDir)).toBe(true);
    const entries = fs.readdirSync(migrationsDir);
    // Should have at least one migration directory + lock file
    expect(entries.length).toBeGreaterThanOrEqual(2);
  });

  it('should not have .eslintrc.json (flat config only)', () => {
    const eslintrcPath = path.resolve(__dirname, '../../.eslintrc.json');
    expect(fs.existsSync(eslintrcPath)).toBe(false);
  });

  it('should have eslint.config.mjs for flat config', () => {
    const flatConfigPath = path.resolve(__dirname, '../../eslint.config.mjs');
    expect(fs.existsSync(flatConfigPath)).toBe(true);
  });

  it('should have seed.ts with required test users', () => {
    const seed = fs.readFileSync(
      path.resolve(__dirname, '../../prisma/seed.ts'),
      'utf-8',
    );
    // Seed creates users with emails test-user-{1..5}@test.com
    expect(seed).toContain('test-user-');
    expect(seed).toContain('@test.com');
    expect(seed).toContain('test-admin-1@test.com');
    expect(seed).toContain('bcryptjs');
    expect(seed).toContain('ADMIN');
  });
});

describe('Build Smoke Test', () => {
  it('should have a valid Next.js app directory structure', () => {
    expect(
      fs.existsSync(path.resolve(__dirname, '../../src/app/layout.tsx')),
    ).toBe(true);
    expect(fs.existsSync(path.resolve(__dirname, '../../next.config.ts'))).toBe(
      true,
    );
    expect(fs.existsSync(path.resolve(__dirname, '../../tsconfig.json'))).toBe(
      true,
    );
  });

  it('should have Prisma client generated', () => {
    // If @prisma/client is importable with models, generation succeeded
    const { PrismaClient } = require('@prisma/client');
    expect(PrismaClient).toBeDefined();
    const client = new PrismaClient();
    expect(client.user).toBeDefined();
    expect(client.post).toBeDefined();
  });
});
