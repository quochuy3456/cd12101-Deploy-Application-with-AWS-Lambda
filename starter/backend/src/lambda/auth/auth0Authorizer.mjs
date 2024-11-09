import Axios from 'axios'
import jsonwebtoken from 'jsonwebtoken'
import { createLogger } from '../../utils/logger.mjs'
import jwksClient from 'jwks-rsa'

const logger = createLogger('auth')
const AUTH_URL = process.env.AUTH_URL;

export async function handler(event) {
  try {
    const jwtToken = await verifyToken(event.authorizationToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader) {
    const token = getToken(authHeader);

    const client = jwksClient({
        jwksUri: AUTH_URL
    });

    function getKey(header, callback) {
        client.getSigningKey(header.kid, (err, key) => {
            if (err) {
                return callback(err);
            }
            const signingKey = key.getPublicKey() || key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
        });
    }

    return new Promise((resolve, reject) => {
        jsonwebtoken.verify(
            token,
            getKey,
            { algorithms: ["RS256"] },
            (err, decoded) => (err ? reject(err) : resolve(decoded))
        );
    });
}

function getToken(authHeader) {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
