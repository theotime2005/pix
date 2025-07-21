import { PassThrough, pipeline } from 'node:stream';

import { child, SCOPES } from '../../../shared/infrastructure/utils/logger.js';
import * as lengthPrefixedJsonDecoderTransform from './transforms/length-prefixed-json-decoder-transform.js';
import * as messageObjectToEventStreamTransform from './transforms/message-object-to-event-stream-transform.js';

const logger = child('llm:api', { event: SCOPES.LLM });

export const ATTACHMENT_MESSAGE_TYPES = {
  NONE: 'NONE',
  IS_VALID: 'IS_VALID',
  IS_INVALID: 'IS_INVALID',
};
/**
 * @function
 * @name fromLLMResponse
 *
 * @param {Object} params
 * @param {ReadableStream|null} params.llmResponse
 * @param {Function} params.onLLMResponseReceived Callback called when LLM response has been completely retrieved. Will be called asynchronously with one parameter: the complete LLM message
 * @param {string} params.attachmentMessageType
 * @returns {Promise<module:stream.internal.PassThrough>}
 */
export async function fromLLMResponse({ llmResponse, onLLMResponseReceived, attachmentMessageType }) {
  const writableStream = new PassThrough();
  writableStream.on('error', (err) => {
    logger.error(`error while streaming response: ${err}`);
  });
  if (attachmentMessageType !== ATTACHMENT_MESSAGE_TYPES.NONE) {
    writableStream.write(getAttachmentEventMessage(attachmentMessageType === ATTACHMENT_MESSAGE_TYPES.IS_VALID));
  }
  const readableStream = llmResponse ?? emptyReadable();
  const completeLLMMessage = [];
  pipeline(
    readableStream,
    lengthPrefixedJsonDecoderTransform.getTransform(),
    messageObjectToEventStreamTransform.getTransform(completeLLMMessage),
    writableStream,
    async (err) => {
      if (err) {
        logger.error(`error in pipeline: ${err}`);
        if (!writableStream.closed && !writableStream.errored) {
          writableStream.end('Error while streaming response from LLM');
        }
      } else {
        await onLLMResponseReceived(completeLLMMessage.join(''));
      }
    },
  );
  return writableStream;
}

function getAttachmentEventMessage(isValid) {
  return 'event: attachment-' + (isValid ? 'success' : 'failure') + '\ndata: \n\n';
}

function emptyReadable() {
  const readableStream = new PassThrough();
  readableStream.end();
  return readableStream;
}
