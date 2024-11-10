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

export class TodosAccess {
    constructor(
        client = new DynamoDBClient({}),
        todosTable = TODOS_TABLE,
        todosCreatedAtIndex = TODOS_CREATED_AT_INDEX
    ) {
        this.client = client;
        this.todosTable = todosTable;
        this.todosCreatedAtIndex = todosCreatedAtIndex;
        this.docClient = DynamoDBDocumentClient.from(this.client);
    }

    async getAllTodosForUser(userId) {
        logger.info({
            "action": `Getting all todos for user: ${userId}`
        });

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
                "action": `Retrieved ${response.Items.length} todos for user: ${userId}`
            });
            return response.Items;
        } catch (error) {
            logger.error({
                    "action": `Error getting todos for user ${userId}: ${error.message}`
                });
            throw new Error('Could not retrieve todos');
        }
    }

    async createTodo(newTodo) {
        logger.info({
                    "action": `Creating todo for user ${newTodo.userId}`
                });

        const command = new PutCommand({
            TableName: this.todosTable,
            Item: newTodo,
        });

        try {
            await this.docClient.send(command);
            logger.info({
                    "action": `Successfully created todo with ID: ${newTodo.todoId}`
                });
        } catch (error) {
            logger.error({
                    "action": `Error creating todo for user ${newTodo.userId}: ${error.message}`
                });
            throw new Error('Could not create todo');
        }
    }

    async updateTodo(todoId, userId, updatedTodo) {
        logger.info({
                    "action": `Updating todo ${todoId} for user ${userId}`
                });

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
                    "action": `Updated todo ${todoId} for user ${userId}`
                });
            return response.Attributes;
        } catch (error) {
            logger.error({
                    "action": `Error updating todo ${todoId} for user ${userId}: ${error.message}`
                });
            throw new Error('Could not update todo');
        }
    }

    async updateAttachmentUrlTodo(todoId, userId, attachmentUrl) {
        logger.info({
                    "action": `Updating attachment URL for todo ${todoId} for user ${userId}`
                });

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
                    "action": `Updated attachment URL for todo ${todoId} with new URL: ${attachmentUrl}`
                });
            return response.Attributes;
        } catch (error) {
            logger.error({
                    "action": `Error updating attachment URL for todo ${todoId}: ${error.message}`
                });
            throw new Error('Could not update attachment URL');
        }
    }

    async deleteTodo(todoId, userId) {
        logger.info({
                    "action": `Deleting todo ${todoId} for user ${userId}`
                });
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
                    "action": `Successfully deleted todo ${todoId}`
                });
        } catch (error) {
            logger.error({
                    "action": `Error deleting todo ${todoId} for user ${userId}: ${error.message}`
                });
            throw new Error('Could not delete todo');
        }
    }
}
