import AWSXRay from 'aws-xray-sdk-core';
import { createLogger } from '../utils/logger.mjs';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    QueryCommand,
    DeleteCommand,
    PutCommand,
    UpdateCommand
} from "@aws-sdk/lib-dynamodb";

const logger = createLogger("todoAccess");

const TODOS_TABLE = process.env.TODOS_TABLE;
const TODOS_CREATED_AT_INDEX = process.env.TODOS_CREATED_AT_INDEX;

// Wrap the DynamoDB client with X-Ray
const XRayDynamoDBClient = AWSXRay.captureAWSv3Client(new DynamoDBClient());

export class TodosAccess {
    constructor(
        client = XRayDynamoDBClient,
        todosTable = TODOS_TABLE,
        todosCreatedAtIndex = TODOS_CREATED_AT_INDEX
    ) {
        this.client = client;
        this.todosTable = todosTable;
        this.todosCreatedAtIndex = todosCreatedAtIndex;
        this.docClient = DynamoDBDocumentClient.from(this.client);
    }

    async getAllTodosForUser(userId) {
        logger.info({ action: `Getting all todos for user: ${userId}` });

        const command = new QueryCommand({
            TableName: this.todosTable,
            IndexName: this.todosCreatedAtIndex,
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId
            },
            ConsistentRead: true,
        });

        try {
            const response = await this.docClient.send(command);
            logger.info({
                action: 'Retrieved todos',
                userId,
                todosCount: response.Items.length
            });
            return response.Items;
        } catch (error) {
            logger.error({
                action: `Error retrieving todos for user ${userId}`,
                error: error.message
            });
            throw new Error('Could not retrieve todos');
        }
    }

    async createTodo(newTodo) {
        logger.info({ action: `Creating todo for user ${newTodo.userId}` });

        const command = new PutCommand({
            TableName: this.todosTable,
            Item: newTodo,
        });

        try {
            await this.docClient.send(command);
            logger.info({
                action: 'Created todo',
                userId: newTodo.userId,
                todoId: newTodo.todoId
            });
        } catch (error) {
            logger.error({
                action: `Error creating todo for user ${newTodo.userId}`,
                error: error.message
            });
            throw new Error('Could not create todo');
        }
    }

    async updateTodo(todoId, userId, updatedTodo) {
        logger.info({ action: `Updating todo ${todoId} for user ${userId}` });

        const command = new UpdateCommand({
            TableName: this.todosTable,
            UpdateExpression: "set #name = :name, dueDate = :dueDate, done = :done",
            Key: {
                "todoId": todoId,
                "userId": userId
            },
            ExpressionAttributeNames: {
                "#name": "name",
            },
            ExpressionAttributeValues: {
                ":name": updatedTodo.name,
                ":dueDate": updatedTodo.dueDate,
                ":done": updatedTodo.done
            },
            ReturnValues: "ALL_NEW",
        });

        try {
            const response = await this.docClient.send(command);
            logger.info({
                action: 'Updated todo',
                userId,
                todoId
            });
            return response.Attributes;
        } catch (error) {
            logger.error({
                action: `Error updating todo ${todoId} for user ${userId}`,
                error: error.message
            });
            throw new Error('Could not update todo');
        }
    }

    async updateAttachmentUrlTodo(todoId, userId, attachmentUrl) {
        logger.info({ action: `Updating attachment URL for todo ${todoId} for user ${userId}` });

        const command = new UpdateCommand({
            TableName: this.todosTable,
            UpdateExpression: "set attachmentUrl = :attachmentUrl",
            Key: {
                "todoId": todoId,
                "userId": userId
            },
            ExpressionAttributeValues: {
                ":attachmentUrl": attachmentUrl
            },
            ReturnValues: "ALL_NEW",
        });

        try {
            const response = await this.docClient.send(command);
            logger.info({
                action: 'Updated attachment URL',
                userId,
                todoId,
                attachmentUrl
            });
            return response.Attributes;
        } catch (error) {
            logger.error({
                action: `Error updating attachment URL for todo ${todoId}`,
                error: error.message
            });
            throw new Error('Could not update attachment URL');
        }
    }

    async deleteTodo(todoId, userId) {
        logger.info({ action: `Deleting todo ${todoId} for user ${userId}` });

        const command = new DeleteCommand({
            TableName: this.todosTable,
            Key: {
                "todoId": todoId,
                "userId": userId
            }
        });

        try {
            await this.docClient.send(command);
            logger.info({
                action: 'Deleted todo',
                userId,
                todoId
            });
        } catch (error) {
            logger.error({
                action: `Error deleting todo ${todoId} for user ${userId}`,
                error: error.message
            });
            throw new Error('Could not delete todo');
        }
    }
}
