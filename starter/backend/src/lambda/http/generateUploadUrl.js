import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'

import { parseUserId } from "../../auth/utils.mjs";
import { updateAttachmentUrlTodo, getUploadUrl } from "../../businessLogic/todos.mjs";

const baseHandler = async (event) => {
    const userId = parseUserId(event.headers.Authorization);
    const taskId = event.pathParameters.todoId;

    const uploadedUrl = await getUploadUrl(`${userId}/${taskId}`);

    await updateAttachmentUrlTodo(taskId, userId);

    return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
            uploadUrl: uploadedUrl
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
