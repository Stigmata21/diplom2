// src/lib/jwt.ts
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'X7k9pL2mQ8vT5nR3jW6yB4zA1cF8gH4';

interface TokenPayload {
    id: number;
    username: string;
    email: string;
    avatar_url?: string;
    role: string;
    iat?: number;
    exp?: number;
}

export function signToken(payload: object): string {
    // console.log('Signing token with secret:', SECRET);
    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });
    // console.log('Generated token:', token);
    return token;
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        // console.log('Verifying token with secret:', SECRET);
        // console.log('Token to verify:', token);
        const decoded = jwt.verify(token, SECRET) as TokenPayload;
        // console.log('Decoded token:', decoded);
        return decoded;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}