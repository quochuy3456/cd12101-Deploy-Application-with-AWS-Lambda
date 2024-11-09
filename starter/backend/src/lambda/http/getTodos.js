import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'

import { getAllTodosForUser } from '../../businessLogic/todos.mjs';
import { parseUserId } from '../../auth/utils.mjs';

const baseHandler = async (event) => {
    const userId = parseUserId(event.headers.Authorization);
    const items = await getAllTodosForUser(userId);

    return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({ items }),
    };
}

export const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(
        cors({
            credentials: true
        })
    )
