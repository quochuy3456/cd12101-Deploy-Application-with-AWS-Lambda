import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'

import { parseUserId } from "../../auth/utils.mjs";
import { deleteTodo } from "../../businessLogic/todos.mjs";

const baseHandler = async (event) => {
    const userId = parseUserId(event.headers.Authorization);
    const todoId = event.pathParameters.todoId;
    await deleteTodo(todoId, userId);

    return {
        statusCode: 204,
        headers: {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Credentials': true
                },
        body: JSON.stringify({})
    };
};

export const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(
        cors({
            credentials: true
        })
    )
