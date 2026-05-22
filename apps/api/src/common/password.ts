import * as argon2 from 'argon2';
import * as bcrypt from 'bcryptjs';

/**
 * Hashing de contraseñas con Argon2id (recomendación preferente de OWASP).
 *
 * Migración gradual: las contraseñas nuevas se hashean con Argon2id; las
 * cuentas antiguas conservan su hash bcrypt y se re-hashean a Argon2id de forma
 * transparente la próxima vez que el usuario inicia sesión (ver necesitaRehash).
 * Por eso se mantiene bcryptjs como dependencia: para verificar los hashes
 * legacy.
 */

// Parámetros de Argon2id alineados con la guía de OWASP (Password Storage
// Cheat Sheet): 19 MiB de memoria, 2 iteraciones, paralelismo 1.
const ARGON2_OPCIONES: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456, // 19 MiB en KiB
  timeCost: 2,
  parallelism: 1,
};

/** Hashea una contraseña con Argon2id. */
export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPCIONES);
}

/**
 * Verifica una contraseña contra un hash, detectando el algoritmo por el
 * prefijo del hash: "$argon2" para Argon2, "$2" para bcrypt (cuentas legacy).
 */
export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  if (!hash) return false;
  try {
    if (hash.startsWith('$argon2')) {
      return await argon2.verify(hash, password);
    }
    // Hash bcrypt antiguo ($2a$ / $2b$ / $2y$).
    return await bcrypt.compare(password, hash);
  } catch {
    // Hash corrupto o con formato no reconocido: se trata como no válido.
    return false;
  }
}

/**
 * Indica si un hash debería re-hashearse a Argon2id. Es true para cualquier
 * hash que no sea Argon2 (es decir, los hashes bcrypt heredados). Se usa tras
 * un login exitoso para migrar la cuenta sin pedir nada al usuario.
 */
export function necesitaRehash(hash: string): boolean {
  return !hash.startsWith('$argon2');
}

// Hash Argon2id fijo y válido, usado SOLO como señuelo para la defensa contra
// timing attacks (verificacionDummy). No corresponde a ninguna cuenta real.
const HASH_DUMMY =
  '$argon2id$v=19$m=19456,t=2,p=1$vMbblmHLVnNVBERRxTZBCg$m6+RjEAQAjZZ2ilFjfL6JfDk55hJ1WEx05wWih+AY44';

/**
 * Verificación señuelo para el caso "el usuario no existe": ejecuta un
 * argon2.verify completo contra un hash Argon2id real, de modo que la latencia
 * del login sea comparable a la de una cuenta que sí existe. Usa Argon2id (no
 * bcrypt) porque es el algoritmo de las cuentas tras la migración y su tiempo
 * de cómputo es estable.
 */
export async function verificacionDummy(password: string): Promise<void> {
  await verifyPassword(HASH_DUMMY, password);
}

/**
 * Comprueba al arranque que el binario nativo de Argon2 funciona (hashea y
 * verifica un valor conocido). Si falla, lanza: es preferible un arranque que
 * falla rápido y ruidoso a un servicio que en producción rechaza todas las
 * contraseñas Argon2id de forma silenciosa.
 */
export async function smokeTestArgon2(): Promise<void> {
  const muestra = 'smoke-test-argon2';
  const hash = await hashPassword(muestra);
  const ok = await argon2.verify(hash, muestra);
  if (!ok) {
    throw new Error('Argon2 smoke test falló: hash/verify no es consistente');
  }
}
