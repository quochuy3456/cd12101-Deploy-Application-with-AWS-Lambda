import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'

import { parseUserId } from "../../auth/utils.mjs";
import { createTodo } from "../../businessLogic/todos.mjs";


const baseHandler = async (event) => {
    const userId = parseUserId(event.headers.Authorization);
    const newTask = JSON.parse(event.body);

    const task = await createTodo(userId, newTask);

    return {
        statusCode: 200,
        headers: {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
            item: task
        })
    };
};

export const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(
        cors({
            credentials: true
        })
    )
