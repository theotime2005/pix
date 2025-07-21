import {
  ChatForbiddenError,
  ChatNotFoundError,
  MaxPromptsReachedError,
  NoAttachmentNeededError,
  NoAttachmentNorMessageProvidedError,
  TooLargeMessageInputError,
} from '../errors.js';

export async function promptChat({
  chatId,
  userId,
  message,
  attachmentName,
  chatRepository,
  promptRepository,
  toEventStream,
}) {
  if (!chatId) {
    throw new ChatNotFoundError('null id provided');
  }
  if (!attachmentName && !message) {
    throw new NoAttachmentNorMessageProvidedError();
  }

  const chat = await chatRepository.get(chatId);
  if (chat.userId != undefined && userId !== chat.userId) {
    throw new ChatForbiddenError();
  }

  const { configuration } = chat;
  if (attachmentName && !configuration.hasAttachment) {
    throw new NoAttachmentNeededError();
  }
  let attachmentMessageType;
  if (attachmentName) {
    if (chat.isAttachmentValid(attachmentName)) {
      chat.addAttachmentContextMessages(configuration.attachmentName, configuration.attachmentContext, !!message);
      attachmentMessageType = toEventStream.ATTACHMENT_MESSAGE_TYPES.IS_VALID;
    } else {
      attachmentMessageType = toEventStream.ATTACHMENT_MESSAGE_TYPES.IS_INVALID;
    }
  } else {
    attachmentMessageType = toEventStream.ATTACHMENT_MESSAGE_TYPES.NONE;
  }
  let readableStream = null;
  if (message) {
    if (message.length > configuration.inputMaxChars) {
      throw new TooLargeMessageInputError();
    }

    if (chat.currentPromptsCount >= configuration.inputMaxPrompts) {
      throw new MaxPromptsReachedError();
    }

    readableStream = await promptRepository.prompt({
      message,
      chat,
    });
  }

  return toEventStream.fromLLMResponse({
    llmResponse: readableStream,
    onLLMResponseReceived: addMessagesToChat(chat, message, chatRepository),
    attachmentMessageType,
  });
}

function addMessagesToChat(chat, prompt, chatRepository) {
  return async (llmMessage) => {
    chat.addUserMessage(prompt);
    chat.addLLMMessage(llmMessage);
    await chatRepository.save(chat);
  };
}
