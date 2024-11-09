import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'

import { parseUserId } from "../../auth/utils.mjs";
import { updateTodo } from "../../businessLogic/todos.mjs";

const baseHandler = async (event) => {
    const userId = parseUserId(event.headers.Authorization)
    const taskId = event.pathParameters.todoId
    const updatedTask = JSON.parse(event.body)

    await updateTodo(taskId, userId, updatedTask)

    return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({}),
    }
}

export const handler = middy(baseHandler)
    .use(httpErrorHandler())
    .use(
        cors({
            credentials: true
        })
    )
