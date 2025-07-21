import { Configuration } from './Configuration.js';

export class Chat {
  /**
   * @param {Object} params
   * @param {string} params.id
   * @param {number=} params.userId
   * @param {string} params.configurationId
   * @param {Configuration} params.configuration
   * @param {boolean} params.hasAttachmentContextBeenAdded
   * @param {Message[]} params.messages
   */
  constructor({ id, userId, configurationId, configuration, hasAttachmentContextBeenAdded, messages = [] }) {
    this.id = id;
    this.userId = userId;
    this.configurationId = configurationId;
    this.configuration = configuration;
    this.hasAttachmentContextBeenAdded = hasAttachmentContextBeenAdded;
    this.messages = messages;
  }

  /**
   * @param {string=} message
   */
  addUserMessage(message) {
    if (!message) return;
    this.messages.push(new Message({ content: message, isFromUser: true }));
  }

  /**
   * @param {string} attachmentName
   * @param {string} attachmentContext
   * @param {boolean} notCounted
   */
  addAttachmentContextMessages(attachmentName, attachmentContext, notCounted) {
    if (this.hasAttachmentContextBeenAdded) return;
    this.messages.push(new Message({ attachmentName, isFromUser: true, notCounted }));
    this.messages.push(new Message({ attachmentName, attachmentContext, isFromUser: false }));
    this.hasAttachmentContextBeenAdded = true;
  }

  /**
   * @param {string=} message
   */
  addLLMMessage(message) {
    if (!message) return;
    this.messages.push(new Message({ content: message, isFromUser: false }));
  }

  get currentPromptsCount() {
    return this.messages.filter((message) => message.isFromUser && !message.notCounted).length;
  }

  toDTO() {
    return {
      id: this.id,
      userId: this.userId,
      configurationId: this.configurationId,
      configuration: this.configuration.toDTO(),
      hasAttachmentContextBeenAdded: this.hasAttachmentContextBeenAdded,
      messages: this.messages.map((message) => message.toDTO()),
    };
  }

  isAttachmentValid(attachmentName) {
    if (!this.configuration.hasAttachment) {
      return false;
    }
    const fileExtension = attachmentName.split('.').at(-1);
    const attachmentFilename = attachmentName.split('.').slice(0, -1).join('');
    const fileExtensionFromConfig = this.configuration.attachmentName.split('.').at(-1);
    const attachmentFilenameFromConfig = this.configuration.attachmentName.split('.').slice(0, -1).join('');
    if (fileExtension !== fileExtensionFromConfig) {
      return false;
    }
    return attachmentFilename.includes(attachmentFilenameFromConfig);
  }

  static fromDTO(chatDTO) {
    return new Chat({
      ...chatDTO,
      configuration: Configuration.fromDTO(chatDTO.configuration),
      messages: chatDTO.messages.map((messageDTO) => new Message(messageDTO)),
    });
  }
}

export class Message {
  /**
   * @constructor
   * @param {Object} params
   * @param {string=} params.content
   * @param {string=} params.attachmentName
   * @param {string=} params.attachmentContext
   * @param {boolean} params.isFromUser
   * @param {boolean=} params.notCounted
   */
  constructor({ content, attachmentName, attachmentContext, isFromUser, notCounted }) {
    this.content = content;
    this.isFromUser = isFromUser;
    this.notCounted = !!notCounted;
    this.attachmentName = attachmentName;
    this.attachmentContext = attachmentContext;
  }

  get isAttachment() {
    return !!this.attachmentName && this.isFromUser;
  }

  get isAttachmentContent() {
    return !!this.attachmentName && !this.isFromUser;
  }

  get #contentForLLMHistory() {
    if (this.content) return this.content;
    if (this.isAttachment) {
      return `<system_notification>L'utilisateur a téléversé une pièce jointe : <attachment_name>${this.attachmentName}</attachment_name></system_notification>`;
    }
    if (this.isAttachmentContent) {
      return `<read_attachment_tool>Lecture de la pièce jointe, ${this.attachmentName} : <attachment_content>${this.attachmentContext}</attachment_content></read_attachment_tool>`;
    }
    throw new Error('chat message should have content or attachment');
  }

  toDTO() {
    return {
      content: this.content,
      attachmentName: this.attachmentName,
      attachmentContext: this.attachmentContext,
      isFromUser: this.isFromUser,
      notCounted: this.notCounted,
    };
  }

  toLLMHistory() {
    return {
      content: this.#contentForLLMHistory,
      role: this.isFromUser ? 'user' : 'assistant',
    };
  }
}
