import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createAdminClient } from '@/lib/supabase/server';
import { auditService } from './audit.service';
import type { User, JWTPayload, AuthSession } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET!;
const SESSION_HOURS = parseInt(process.env.SESSION_TIMEOUT_HOURS || '8');

export const authService = {
  /**
   * Realiza login com login e senha
   */
  async login(
    login: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ user: User; token: string; isFirstAccess: boolean } | null> {
    const supabase = createAdminClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('login', login)
      .eq('is_active', true)
      .single();

    if (error || !user) return null;

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return null;

    const token = this.generateToken(user);

    await auditService.log({
      userId: user.id,
      action: 'LOGIN',
      description: `Login realizado — ${user.name}`,
      ipAddress,
      userAgent,
    });

    return {
      user: this.sanitizeUser(user),
      token,
      isFirstAccess: user.is_first_access,
    };
  },

  /**
   * Troca senha (primeiro acesso ou redefinição)
   */
  async changePassword(
    userId: string,
    newPassword: string,
    ipAddress: string,
    userAgent: string
  ): Promise<boolean> {
    const supabase = createAdminClient();
    const hash = await bcrypt.hash(newPassword, 12);

    const { error } = await supabase
      .from('users')
      .update({ password_hash: hash, is_first_access: false })
      .eq('id', userId);

    if (error) return false;

    await auditService.log({
      userId,
      action: 'PASSWORD_CHANGED',
      description: 'Senha alterada',
      ipAddress,
      userAgent,
    });

    return true;
  },

  /**
   * Verifica token JWT e retorna payload
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return null;
    }
  },

  /**
   * Gera novo token JWT
   */
  generateToken(user: { id: string; role: string; login: string }): string {
    return jwt.sign(
      {
        sub: user.id,
        role: user.role,
        login: user.login,
      },
      JWT_SECRET,
      { expiresIn: `${SESSION_HOURS}h` }
    );
  },

  /**
   * Busca usuário por ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return this.sanitizeUser(data);
  },

  /**
   * Remove dados sensíveis do objeto usuário
   */
  sanitizeUser(user: Record<string, unknown>): User {
    return {
      id: user.id as string,
      name: user.name as string,
      crm: user.crm as string,
      phone: user.phone as string,
      login: user.login as string,
      role: user.role as 'RT' | 'EMPLOYEE',
      isFirstAccess: user.is_first_access as boolean,
      isActive: user.is_active as boolean,
      createdAt: user.created_at as string,
      updatedAt: user.updated_at as string,
    };
  },
};
export const verifyToken = authService.verifyToken;
