-- AddCheckConstraint
-- Integridad de datos: la columna password siempre guarda un hash, nunca un
-- valor corto/truncado. Un hash bcrypt mide 60 chars y uno Argon2id ~95, así
-- que el umbral de 60 es válido para ambos algoritmos. Defensa frente a un bug
-- en cualquier ruta de escritura que pudiera persistir un hash inválido.
ALTER TABLE "User"
  ADD CONSTRAINT "User_password_min_len" CHECK (length(password) >= 60);
