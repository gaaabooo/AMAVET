import * as bcrypt from 'bcryptjs';
import { hashPassword, verifyPassword, necesitaRehash } from './password';

describe('password helper', () => {
  describe('hashPassword', () => {
    it('produce un hash Argon2id (prefijo $argon2id$)', async () => {
      const hash = await hashPassword('MiClave123');
      expect(hash.startsWith('$argon2id$')).toBe(true);
    });

    it('dos hashes de la misma contraseña son distintos (sal aleatoria)', async () => {
      const a = await hashPassword('MiClave123');
      const b = await hashPassword('MiClave123');
      expect(a).not.toBe(b);
    });
  });

  describe('verifyPassword', () => {
    it('verifica correctamente un hash Argon2id', async () => {
      const hash = await hashPassword('MiClave123');
      expect(await verifyPassword(hash, 'MiClave123')).toBe(true);
      expect(await verifyPassword(hash, 'otra')).toBe(false);
    });

    it('verifica correctamente un hash bcrypt heredado', async () => {
      const hashBcrypt = await bcrypt.hash('MiClave123', 12);
      expect(await verifyPassword(hashBcrypt, 'MiClave123')).toBe(true);
      expect(await verifyPassword(hashBcrypt, 'otra')).toBe(false);
    });

    it('devuelve false ante un hash vacío o corrupto', async () => {
      expect(await verifyPassword('', 'x')).toBe(false);
      expect(await verifyPassword('no-es-un-hash', 'x')).toBe(false);
    });
  });

  describe('necesitaRehash', () => {
    it('true para un hash bcrypt heredado', async () => {
      const hashBcrypt = await bcrypt.hash('x', 12);
      expect(necesitaRehash(hashBcrypt)).toBe(true);
    });

    it('false para un hash Argon2id', async () => {
      const hash = await hashPassword('x');
      expect(necesitaRehash(hash)).toBe(false);
    });
  });
});
