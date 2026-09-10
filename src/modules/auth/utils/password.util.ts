import * as argon2 from 'argon2';

export const hashValue = (value: string) => argon2.hash(value);

export const verifyValue = (hash: string, value: string) =>
  argon2.verify(hash, value);
