import AWSXRay from 'aws-xray-sdk-core';
import { v4 as uuidv4 } from 'uuid';
import { TodosAccess } from '../dataLayer/todosAccess.mjs';
import { PutObjectCommand, S3Client as S3 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createLogger } from '../utils/logger.mjs';

const logger = createLogger('todosAndS3Access');

// Wrap the AWS SDK and initialize S3 with X-Ray enabled
const XRayS3Client = AWSXRay.captureAWSv3Client(new S3());
const todosAccess = new TodosAccess();
const bucketName = process.env.TODOS_BUCKET;
const urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION) || 300;

export const getAllTodosForUser = async (userId) => {
    try {
        const todos = await todosAccess.getAllTodosForUser(userId);
        logger.info({ action: 'Retrieved todos', userId, todosCount: todos.length });
        return todos;
    } catch (error) {
        logger.error({ action: `Error retrieving todos for user ${userId}`, error });
        throw new Error('Could not fetch todos');
    }
};

export const createTodo = async (userId, newTodo) => {
    try {
        newTodo.todoId = uuidv4();
        newTodo.userId = userId;
        newTodo.createdAt = new Date().toISOString();
        newTodo.attachmentUrl = "";
        newTodo.done = false;

        await todosAccess.createTodo(newTodo);
        logger.info({ action: 'Created todo', userId, todoId: newTodo.todoId });
        return newTodo;
    } catch (error) {
        logger.error({ action: `Error creating todo for user ${userId}`, error });
        throw new Error('Could not create todo');
    }
};

export const updateTodo = async (todoId, userId, updatedTodo) => {
    try {
        await todosAccess.updateTodo(todoId, userId, updatedTodo);
        logger.info({ action: 'Updated todo', userId, todoId });
        return { ...updatedTodo, todoId, userId };
    } catch (error) {
        logger.error({ action: `Error updating todo ${todoId} for user ${userId}`, error });
        throw new Error('Could not update todo');
    }
};

export const deleteTodo = async (todoId, userId) => {
    try {
        await todosAccess.deleteTodo(todoId, userId);
        logger.info({ action: 'Deleted todo', userId, todoId });
    } catch (error) {
        logger.error({ action: `Error deleting todo ${todoId} for user ${userId}`, error });
        throw new Error('Could not delete todo');
    }
};

export const updateAttachmentUrlTodo = async (todoId, userId) => {
    try {
        const attachmentUrl = `https://${bucketName}.s3.amazonaws.com/${userId}/${todoId}`;
        await todosAccess.updateAttachmentUrlTodo(todoId, userId, attachmentUrl);
        logger.info({ action: 'Updated attachment URL', userId, todoId, attachmentUrl });
        return attachmentUrl;
    } catch (error) {
        logger.error({ action: `Error updating attachment URL for todo ${todoId} for user ${userId}`, error });
        throw new Error('Could not update attachment URL');
    }
};

export const getUploadUrl = async (key) => {
    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key
        });
        const url = await getSignedUrl(XRayS3Client, command, {
            expiresIn: urlExpiration
        });
        logger.info({ action: 'Generated upload URL', key });
        return url;
    } catch (error) {
        logger.error({ action: `Error generating upload URL for key ${key}`, error });
        throw new Error('Could not generate upload URL');
    }
};
