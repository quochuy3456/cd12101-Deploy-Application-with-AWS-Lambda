import { decode } from 'jsonwebtoken'
import { createLogger } from '../utils/logger.mjs'

const logger = createLogger('utils')
/**
 * Parse a JWT token and return a user id
 * @param jwtToken JWT token to parse
 * @returns a user id from the JWT token
 */
export function parseUserId(jwtToken) {
    try {
        const split = jwtToken.split(' ');
        const token = split[1];
        if (!token) throw new Error('No token found in the authorization header');

        const decodedJwt = decode(token);
        if (!decodedJwt || typeof decodedJwt.sub !== 'string') {
            throw new Error('Invalid token structure: "sub" field is missing');
        }

        logger.info('User was authorized');
        return decodedJwt.sub;
    } catch (error) {
        logger.error('Failed to parse user ID from JWT token', { error: error.message });
        return null;
    }
}
