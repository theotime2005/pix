import { Readable } from 'node:stream';

import ms from 'ms';

import {
  ChatForbiddenError,
  ChatNotFoundError,
  MaxPromptsReachedError,
  NoAttachmentNeededError,
  NoAttachmentNorMessageProvidedError,
  TooLargeMessageInputError,
} from '../../../../../src/llm/domain/errors.js';
import { Chat, Message } from '../../../../../src/llm/domain/models/Chat.js';
import { Configuration } from '../../../../../src/llm/domain/models/Configuration.js';
import { promptChat } from '../../../../../src/llm/domain/usecases/prompt-chat.js';
import { chatRepository, promptRepository } from '../../../../../src/llm/infrastructure/repositories/index.js';
import * as toEventStream from '../../../../../src/llm/infrastructure/streaming/to-event-stream.js';
import { temporaryStorage } from '../../../../../src/shared/infrastructure/key-value-storages/index.js';
import { catchErr, expect, nock } from '../../../../test-helper.js';

const chatTemporaryStorage = temporaryStorage.withPrefix(chatRepository.CHAT_STORAGE_PREFIX);

describe('LLM | Integration | Domain | UseCases | prompt-chat', function () {
  let dependencies;

  beforeEach(function () {
    dependencies = {
      promptRepository,
      chatRepository,
      toEventStream,
    };
  });
  afterEach(async function () {
    await chatTemporaryStorage.flushAll();
  });

  context('when no chat id provided', function () {
    it('should throw a ChatNotFoundError', async function () {
      // given
      const chatId = null;

      // when
      const err = await catchErr(promptChat)({ chatId, message: 'un message', userId: 12345, ...dependencies });

      // then
      expect(err).to.be.instanceOf(ChatNotFoundError);
      expect(err.message).to.equal('The chat of id "null id provided" does not exist');
    });
  });

  context('when user does not own the chat', function () {
    it('should throw a ChatForbiddenError', async function () {
      // given
      const chat = new Chat({
        id: 'chatId',
        userId: 123456,
        configurationId: 'uneConfigQuiExist',
        configuration: new Configuration({ llm: {} }),
        hasAttachmentContextBeenAdded: false,
        messages: [],
      });
      await chatTemporaryStorage.save({
        key: 'chatId',
        value: chat.toDTO(),
        expirationDelaySeconds: ms('24h'),
      });

      // when
      const err = await catchErr(promptChat)({
        chatId: 'chatId',
        userId: 12345,
        message: 'un message',
        ...dependencies,
      });

      // then
      expect(err).to.be.instanceOf(ChatForbiddenError);
      expect(err.message).to.equal('User has not the right to use this chat');
    });
  });

  context('checking maxChars limit', function () {
    it('should throw a TooLargeMessageInputError when maxChars is exceeded', async function () {
      // given
      const chat = new Chat({
        id: 'chatId',
        userId: 123,
        configurationId: 'uneConfigQuiExist',
        configuration: new Configuration({
          llm: {},
          challenge: {
            inputMaxChars: 5,
          },
        }),
        hasAttachmentContextBeenAdded: false,
        messages: [],
      });
      await chatTemporaryStorage.save({
        key: 'chatId',
        value: chat.toDTO(),
        expirationDelaySeconds: ms('24h'),
      });

      // when
      const err = await catchErr(promptChat)({
        chatId: 'chatId',
        userId: 123,
        message: 'un message',
        ...dependencies,
      });

      // then
      expect(err).to.be.instanceOf(TooLargeMessageInputError);
      expect(err.message).to.equal("You've reached the max characters input");
    });
  });

  context('checking maxPrompts limit', function () {
    it('should ignore messages from LLM when checking for maxPrompts limit', async function () {
      // given
      const chat = new Chat({
        id: 'chatId',
        userId: 123,
        configurationId: 'uneConfigQuiExist',
        configuration: new Configuration({
          llm: {},
          challenge: {
            inputMaxPrompts: 2,
          },
        }),
        hasAttachmentContextBeenAdded: false,
        messages: [
          new Message({ content: 'coucou LLM1', isFromUser: false }),
          new Message({ content: 'coucou LLM2', isFromUser: false }),
          new Message({ content: 'coucou user', isFromUser: true }),
        ],
      });
      await chatTemporaryStorage.save({
        key: chat.id,
        value: chat.toDTO(),
        expirationDelaySeconds: ms('24h'),
      });
      const llmPostPromptScope = nock('https://llm-test.pix.fr/api')
        .post('/chat', {
          configuration: {
            llm: {},
            challenge: {
              inputMaxPrompts: 2,
            },
          },
          history: [
            { content: 'coucou LLM1', role: 'assistant' },
            { content: 'coucou LLM2', role: 'assistant' },
            { content: 'coucou user', role: 'user' },
          ],
          prompt: 'un message',
        })
        .reply(201, Readable.from(['19:{"message":"salut"}']));

      // when
      const stream = await promptChat({
        chatId: 'chatId',
        userId: 123,
        message: 'un message',
        ...dependencies,
      });

      // then
      const parts = [];
      const decoder = new TextDecoder();
      for await (const chunk of stream) {
        parts.push(decoder.decode(chunk));
      }
      const llmResponse = parts.join('');
      expect(llmResponse).to.deep.equal('data: salut\n\n');
      expect(llmPostPromptScope.isDone()).to.be.true;
    });

    it('should throw a MaxPromptsReachedError when user prompts exceed max', async function () {
      // given
      const chat = new Chat({
        id: 'chatId',
        userId: 123,
        configurationId: 'uneConfigQuiExist',
        configuration: new Configuration({
          challenge: {
            inputMaxPrompts: 2,
          },
        }),
        hasAttachmentContextBeenAdded: false,
        messages: [
          new Message({ content: 'coucou user1', isFromUser: true }),
          new Message({ content: 'coucou LLM2', isFromUser: false }),
          new Message({ content: 'coucou user2', isFromUser: true }),
        ],
      });
      await chatTemporaryStorage.save({
        key: chat.id,
        value: chat.toDTO(),
        expirationDelaySeconds: ms('24h'),
      });

      // when
      const err = await catchErr(promptChat)({ chatId: 'chatId', userId: 123, message: 'un message', ...dependencies });

      // then
      expect(err).to.be.instanceOf(MaxPromptsReachedError);
      expect(err.message).to.equal("You've reached the max prompts authorized");
    });
  });

  context('success cases', function () {
    context('when a prompt is provided', function () {
      context('when no attachmentName is provided', function () {
        it('should return a stream which will contain the llm response', async function () {
          // given
          const chat = new Chat({
            id: 'chatId',
            userId: 123,
            configurationId: 'uneConfigQuiExist',
            configuration: new Configuration({
              llm: {
                historySize: 123,
              },
              challenge: {
                inputMaxPrompts: 100,
                inputMaxChars: 255,
              },
            }),
            hasAttachmentContextBeenAdded: false,
            messages: [
              new Message({ content: 'coucou user1', isFromUser: true }),
              new Message({ content: 'coucou LLM1', isFromUser: false }),
            ],
          });
          await chatTemporaryStorage.save({
            key: chat.id,
            value: chat.toDTO(),
            expirationDelaySeconds: ms('24h'),
          });
          const llmPostPromptScope = nock('https://llm-test.pix.fr/api')
            .post('/chat', {
              configuration: {
                llm: {
                  historySize: 123,
                },
                challenge: {
                  inputMaxPrompts: 100,
                  inputMaxChars: 255,
                },
              },
              history: [
                { content: 'coucou user1', role: 'user' },
                { content: 'coucou LLM1', role: 'assistant' },
              ],
              prompt: 'un message',
            })
            .reply(
              201,
              Readable.from([
                '60:{"ceci":"nest pas important","message":"coucou c\'est super"}',
                '40:{"message":"\\nle couscous c plutot bon"}47:{"message":" mais la paella c pas mal aussi\\n"}',
                '29:{"jecrois":{"que":"jaifini"}}',
              ]),
            );

          // when
          const stream = await promptChat({
            chatId: 'chatId',
            userId: 123,
            message: 'un message',
            attachmentName: null,
            ...dependencies,
          });

          // then
          const parts = [];
          const decoder = new TextDecoder();
          for await (const chunk of stream) {
            parts.push(decoder.decode(chunk));
          }
          const llmResponse = parts.join('');
          expect(llmResponse).to.deep.equal(
            "data: coucou c'est super\n\ndata: \ndata: le couscous c plutot bon\n\ndata:  mais la paella c pas mal aussi\ndata: \n\n",
          );
          expect(await chatTemporaryStorage.get('chatId')).to.deep.equal({
            id: 'chatId',
            userId: 123,
            configurationId: 'uneConfigQuiExist',
            configuration: {
              llm: {
                historySize: 123,
              },
              challenge: {
                inputMaxPrompts: 100,
                inputMaxChars: 255,
              },
            },
            hasAttachmentContextBeenAdded: false,
            messages: [
              {
                content: 'coucou user1',
                isFromUser: true,
                notCounted: false,
              },
              {
                content: 'coucou LLM1',
                isFromUser: false,
                notCounted: false,
              },
              {
                content: 'un message',
                isFromUser: true,
                notCounted: false,
              },
              {
                content: "coucou c'est super\nle couscous c plutot bon mais la paella c pas mal aussi\n",
                isFromUser: false,
                notCounted: false,
              },
            ],
          });
          expect(llmPostPromptScope.isDone()).to.be.true;
        });

        context('when configuration is stored in old format', function () {
          it('refetches configuration and stores it back in new format', async function () {
            // given
            const chat = new Chat({
              id: 'chatId',
              userId: 123,
              configuration: new Configuration({
                id: 'uneConfigQuiExist',
                historySize: 123,
                inputMaxPrompts: 100,
                inputMaxChars: 255,
              }),
              hasAttachmentContextBeenAdded: false,
              messages: [
                new Message({ content: 'coucou user1', isFromUser: true }),
                new Message({ content: 'coucou LLM1', isFromUser: false }),
              ],
            });
            await chatTemporaryStorage.save({
              key: chat.id,
              value: chat.toDTO(),
              expirationDelaySeconds: ms('24h'),
            });
            const llmPostPromptScope = nock('https://llm-test.pix.fr/api')
              .post('/chat', {
                configuration: {
                  name: 'Ma config',
                  llm: {
                    historySize: 123,
                  },
                  challenge: {
                    inputMaxPrompts: 100,
                    inputMaxChars: 255,
                  },
                },
                history: [
                  { content: 'coucou user1', role: 'user' },
                  { content: 'coucou LLM1', role: 'assistant' },
                ],
                prompt: 'un message',
              })
              .reply(
                201,
                Readable.from([
                  '60:{"ceci":"nest pas important","message":"coucou c\'est super"}',
                  '40:{"message":"\\nle couscous c plutot bon"}47:{"message":" mais la paella c pas mal aussi\\n"}',
                  '29:{"jecrois":{"que":"jaifini"}}',
                ]),
              );
            const llmGetConfigScope = nock('https://llm-test.pix.fr/api')
              .get('/configurations/uneConfigQuiExist')
              .reply(200, {
                name: 'Ma config',
                llm: {
                  historySize: 123,
                },
                challenge: {
                  inputMaxPrompts: 100,
                  inputMaxChars: 255,
                },
              });

            // when
            const stream = await promptChat({
              chatId: 'chatId',
              userId: 123,
              message: 'un message',
              attachmentName: null,
              ...dependencies,
            });

            // then
            const parts = [];
            const decoder = new TextDecoder();
            for await (const chunk of stream) {
              parts.push(decoder.decode(chunk));
            }
            const llmResponse = parts.join('');
            expect(llmResponse).to.deep.equal(
              "data: coucou c'est super\n\ndata: \ndata: le couscous c plutot bon\n\ndata:  mais la paella c pas mal aussi\ndata: \n\n",
            );
            expect(await chatTemporaryStorage.get('chatId')).to.deep.equal({
              id: 'chatId',
              userId: 123,
              configurationId: 'uneConfigQuiExist',
              configuration: {
                name: 'Ma config',
                llm: {
                  historySize: 123,
                },
                challenge: {
                  inputMaxPrompts: 100,
                  inputMaxChars: 255,
                },
              },
              hasAttachmentContextBeenAdded: false,
              messages: [
                {
                  content: 'coucou user1',
                  isFromUser: true,
                  notCounted: false,
                },
                {
                  content: 'coucou LLM1',
                  isFromUser: false,
                  notCounted: false,
                },
                {
                  content: 'un message',
                  isFromUser: true,
                  notCounted: false,
                },
                {
                  content: "coucou c'est super\nle couscous c plutot bon mais la paella c pas mal aussi\n",
                  isFromUser: false,
                  notCounted: false,
                },
              ],
            });
            expect(llmGetConfigScope.isDone()).to.be.true;
            expect(llmPostPromptScope.isDone()).to.be.true;
          });
        });
      });

      context('when attachmentName is provided', function () {
        context('when no attachmentName is expected for the given configuration', function () {
          it('should throw a NoAttachmentNeededError', async function () {
            // given
            const chat = new Chat({
              id: 'chatId',
              userId: 123,
              configurationId: 'uneConfigQuiExist',
              configuration: new Configuration({
                llm: {
                  historySize: 123,
                },
                challenge: {
                  inputMaxPrompts: 100,
                  inputMaxChars: 255,
                },
              }),
              hasAttachmentContextBeenAdded: false,
              messages: [
                new Message({ content: 'coucou user1', isFromUser: true }),
                new Message({ content: 'coucou LLM2', isFromUser: false }),
                new Message({ content: 'coucou user2', isFromUser: true }),
              ],
            });
            await chatTemporaryStorage.save({
              key: chat.id,
              value: chat.toDTO(),
              expirationDelaySeconds: ms('24h'),
            });

            // when
            const err = await catchErr(promptChat)({
              chatId: 'chatId',
              userId: 123,
              message: 'un message',
              attachmentName: 'un_attachment.pdf',
              ...dependencies,
            });

            // then
            expect(err).to.be.instanceOf(NoAttachmentNeededError);
            expect(err.message).to.equal(
              'Attachment has been provided but is not expected for the given configuration',
            );
          });
        });

        context('when attachmentName is not the expected one for the given configuration', function () {
          it(
            'should return a stream which will contain the attachment event and the llm response while ' +
              'ignoring the invalid attachmentName by not adding anything to the context',
            async function () {
              // given
              const chat = new Chat({
                id: 'chatId',
                userId: 123,
                configurationId: 'uneConfigQuiExist',
                configuration: new Configuration({
                  llm: {
                    historySize: 123,
                  },
                  challenge: {
                    inputMaxPrompts: 100,
                    inputMaxChars: 255,
                  },
                  attachment: {
                    name: 'expected_file.txt',
                    context: 'add me in the chat !',
                  },
                }),
                hasAttachmentContextBeenAdded: false,
                messages: [
                  new Message({ content: 'coucou user1', isFromUser: true }),
                  new Message({ content: 'coucou LLM1', isFromUser: false }),
                ],
              });
              await chatTemporaryStorage.save({
                key: chat.id,
                value: chat.toDTO(),
                expirationDelaySeconds: ms('24h'),
              });
              const llmPostPromptScope = nock('https://llm-test.pix.fr/api')
                .post('/chat', {
                  configuration: {
                    llm: {
                      historySize: 123,
                    },
                    challenge: {
                      inputMaxPrompts: 100,
                      inputMaxChars: 255,
                    },
                    attachment: {
                      name: 'expected_file.txt',
                      context: 'add me in the chat !',
                    },
                  },
                  history: [
                    { content: 'coucou user1', role: 'user' },
                    { content: 'coucou LLM1', role: 'assistant' },
                  ],
                  prompt: 'un message',
                })
                .reply(
                  201,
                  Readable.from([
                    '60:{"ceci":"nest pas important","message":"coucou c\'est super"}',
                    '40:{"message":"\\nle couscous c plutot bon"}47:{"message":" mais la paella c pas mal aussi\\n"}',
                    '29:{"jecrois":{"que":"jaifini"}}',
                  ]),
                );

              // when
              const stream = await promptChat({
                chatId: 'chatId',
                userId: 123,
                message: 'un message',
                attachmentName: 'invalid_file.txt',
                ...dependencies,
              });

              // then
              const parts = [];
              const decoder = new TextDecoder();
              for await (const chunk of stream) {
                parts.push(decoder.decode(chunk));
              }
              const llmResponse = parts.join('');
              const attachmentMessage = 'event: attachment-failure\ndata: \n\n';
              const llmMessage =
                "data: coucou c'est super\n\ndata: \ndata: le couscous c plutot bon\n\ndata:  mais la paella c pas mal aussi\ndata: \n\n";
              expect(llmResponse).to.deep.equal(attachmentMessage + llmMessage);
              expect(await chatTemporaryStorage.get('chatId')).to.deep.equal({
                id: 'chatId',
                userId: 123,
                configurationId: 'uneConfigQuiExist',
                configuration: {
                  llm: {
                    historySize: 123,
                  },
                  challenge: {
                    inputMaxPrompts: 100,
                    inputMaxChars: 255,
                  },
                  attachment: {
                    name: 'expected_file.txt',
                    context: 'add me in the chat !',
                  },
                },
                hasAttachmentContextBeenAdded: false,
                messages: [
                  { content: 'coucou user1', isFromUser: true, notCounted: false },
                  { content: 'coucou LLM1', isFromUser: false, notCounted: false },
                  { content: 'un message', isFromUser: true, notCounted: false },
                  {
                    content: "coucou c'est super\nle couscous c plutot bon mais la paella c pas mal aussi\n",
                    isFromUser: false,
                    notCounted: false,
                  },
                ],
              });
              expect(llmPostPromptScope.isDone()).to.be.true;
            },
          );
        });

        context('when attachmentName is the expected one for the given configuration', function () {
          context('when the context for this attachmentName has already been added', function () {
            it(
              'should return a stream which will contain the attachment event and the llm response while ' +
                'not adding the attachment context in the conversation a second time',
              async function () {
                // given
                const chat = new Chat({
                  id: 'chatId',
                  userId: 123,
                  configurationId: 'uneConfigQuiExist',
                  configuration: new Configuration({
                    llm: {
                      historySize: 123,
                    },
                    challenge: {
                      inputMaxPrompts: 100,
                      inputMaxChars: 255,
                    },
                    attachment: {
                      name: 'expected_file.txt',
                      context: 'add me in the chat !',
                    },
                  }),
                  hasAttachmentContextBeenAdded: true,
                  messages: [
                    new Message({ content: 'coucou user1', isFromUser: true }),
                    new Message({ content: 'coucou LLM1', isFromUser: false }),
                    new Message({
                      content:
                        'Ajoute le fichier fictif "expected_file.txt" à ton contexte. Voici le contenu du fichier :\nadd me in the chat !',
                      isFromUser: true,
                    }),
                    new Message({
                      content: 'Le contenu du fichier fictif a été ajouté au contexte.',
                      isFromUser: false,
                    }),
                    new Message({ content: 'coucou user2', isFromUser: true }),
                    new Message({ content: 'coucou LLM2', isFromUser: false }),
                  ],
                });
                await chatTemporaryStorage.save({
                  key: chat.id,
                  value: chat.toDTO(),
                  expirationDelaySeconds: ms('24h'),
                });
                const llmPostPromptScope = nock('https://llm-test.pix.fr/api')
                  .post('/chat', {
                    configuration: {
                      llm: {
                        historySize: 123,
                      },
                      challenge: {
                        inputMaxPrompts: 100,
                        inputMaxChars: 255,
                      },
                      attachment: {
                        name: 'expected_file.txt',
                        context: 'add me in the chat !',
                      },
                    },
                    history: [
                      { content: 'coucou user1', role: 'user' },
                      { content: 'coucou LLM1', role: 'assistant' },
                      {
                        content:
                          'Ajoute le fichier fictif "expected_file.txt" à ton contexte. Voici le contenu du fichier :\nadd me in the chat !',
                        role: 'user',
                      },
                      {
                        content: 'Le contenu du fichier fictif a été ajouté au contexte.',
                        role: 'assistant',
                      },
                      { content: 'coucou user2', role: 'user' },
                      { content: 'coucou LLM2', role: 'assistant' },
                    ],
                    prompt: 'un message',
                  })
                  .reply(
                    201,
                    Readable.from([
                      '60:{"ceci":"nest pas important","message":"coucou c\'est super"}',
                      '40:{"message":"\\nle couscous c plutot bon"}47:{"message":" mais la paella c pas mal aussi\\n"}',
                      '29:{"jecrois":{"que":"jaifini"}}',
                    ]),
                  );

                // when
                const stream = await promptChat({
                  chatId: 'chatId',
                  userId: 123,
                  message: 'un message',
                  attachmentName: 'expected_file.txt',
                  ...dependencies,
                });

                // then
                const parts = [];
                const decoder = new TextDecoder();
                for await (const chunk of stream) {
                  parts.push(decoder.decode(chunk));
                }
                const llmResponse = parts.join('');
                const attachmentMessage = 'event: attachment-success\ndata: \n\n';
                const llmMessage =
                  "data: coucou c'est super\n\ndata: \ndata: le couscous c plutot bon\n\ndata:  mais la paella c pas mal aussi\ndata: \n\n";
                expect(llmResponse).to.deep.equal(attachmentMessage + llmMessage);
                expect(await chatTemporaryStorage.get('chatId')).to.deep.equal({
                  id: 'chatId',
                  userId: 123,
                  configurationId: 'uneConfigQuiExist',
                  configuration: {
                    llm: {
                      historySize: 123,
                    },
                    challenge: {
                      inputMaxPrompts: 100,
                      inputMaxChars: 255,
                    },
                    attachment: {
                      name: 'expected_file.txt',
                      context: 'add me in the chat !',
                    },
                  },
                  hasAttachmentContextBeenAdded: true,
                  messages: [
                    { content: 'coucou user1', isFromUser: true, notCounted: false },
                    { content: 'coucou LLM1', isFromUser: false, notCounted: false },
                    {
                      content:
                        'Ajoute le fichier fictif "expected_file.txt" à ton contexte. Voici le contenu du fichier :\nadd me in the chat !',
                      isFromUser: true,
                      notCounted: false,
                    },
                    {
                      content: 'Le contenu du fichier fictif a été ajouté au contexte.',
                      isFromUser: false,
                      notCounted: false,
                    },
                    { content: 'coucou user2', isFromUser: true, notCounted: false },
                    { content: 'coucou LLM2', isFromUser: false, notCounted: false },
                    { content: 'un message', isFromUser: true, notCounted: false },
                    {
                      content: "coucou c'est super\nle couscous c plutot bon mais la paella c pas mal aussi\n",
                      isFromUser: false,
                      notCounted: false,
                    },
                  ],
                });
                expect(llmPostPromptScope.isDone()).to.be.true;
              },
            );
          });

          context('when the context for this attachmentName has not been added yet', function () {
            it(
              'should return a stream which will contain the attachment event and the llm response while ' +
                'adding the attachment context in the conversation',
              async function () {
                // given
                const chat = new Chat({
                  id: 'chatId',
                  userId: 123,
                  configurationId: 'uneConfigQuiExist',
                  configuration: new Configuration({
                    llm: {
                      historySize: 123,
                    },
                    challenge: {
                      inputMaxPrompts: 100,
                      inputMaxChars: 255,
                    },
                    attachment: {
                      name: 'expected_file.txt',
                      context: 'add me in the chat !',
                    },
                  }),
                  hasAttachmentContextBeenAdded: false,
                  messages: [
                    new Message({ content: 'coucou user1', isFromUser: true }),
                    new Message({ content: 'coucou LLM1', isFromUser: false }),
                  ],
                });
                await chatTemporaryStorage.save({
                  key: chat.id,
                  value: chat.toDTO(),
                  expirationDelaySeconds: ms('24h'),
                });
                const llmPostPromptScope = nock('https://llm-test.pix.fr/api')
                  .post('/chat', {
                    configuration: {
                      llm: {
                        historySize: 123,
                      },
                      challenge: {
                        inputMaxPrompts: 100,
                        inputMaxChars: 255,
                      },
                      attachment: {
                        name: 'expected_file.txt',
                        context: 'add me in the chat !',
                      },
                    },
                    history: [
                      { content: 'coucou user1', role: 'user' },
                      { content: 'coucou LLM1', role: 'assistant' },
                      {
                        content:
                          "<system_notification>L'utilisateur a téléversé une pièce jointe : <attachment_name>expected_file.txt</attachment_name></system_notification>",
                        role: 'user',
                      },
                      {
                        content:
                          '<read_attachment_tool>Lecture de la pièce jointe, expected_file.txt : <attachment_content>add me in the chat !</attachment_content></read_attachment_tool>',
                        role: 'assistant',
                      },
                    ],
                    prompt: 'un message',
                  })
                  .reply(
                    201,
                    Readable.from([
                      '60:{"ceci":"nest pas important","message":"coucou c\'est super"}',
                      '40:{"message":"\\nle couscous c plutot bon"}47:{"message":" mais la paella c pas mal aussi\\n"}',
                      '29:{"jecrois":{"que":"jaifini"}}',
                    ]),
                  );

                // when
                const stream = await promptChat({
                  chatId: 'chatId',
                  userId: 123,
                  message: 'un message',
                  attachmentName: 'expected_file.txt',
                  ...dependencies,
                });

                // then
                const parts = [];
                const decoder = new TextDecoder();
                for await (const chunk of stream) {
                  parts.push(decoder.decode(chunk));
                }
                const llmResponse = parts.join('');
                const attachmentMessage = 'event: attachment-success\ndata: \n\n';
                const llmMessage =
                  "data: coucou c'est super\n\ndata: \ndata: le couscous c plutot bon\n\ndata:  mais la paella c pas mal aussi\ndata: \n\n";
                expect(llmResponse).to.deep.equal(attachmentMessage + llmMessage);
                expect(await chatTemporaryStorage.get('chatId')).to.deep.equal({
                  id: 'chatId',
                  userId: 123,
                  configurationId: 'uneConfigQuiExist',
                  configuration: {
                    llm: {
                      historySize: 123,
                    },
                    challenge: {
                      inputMaxPrompts: 100,
                      inputMaxChars: 255,
                    },
                    attachment: {
                      name: 'expected_file.txt',
                      context: 'add me in the chat !',
                    },
                  },
                  hasAttachmentContextBeenAdded: true,
                  messages: [
                    { content: 'coucou user1', isFromUser: true, notCounted: false },
                    { content: 'coucou LLM1', isFromUser: false, notCounted: false },
                    {
                      attachmentName: 'expected_file.txt',
                      isFromUser: true,
                      notCounted: true,
                    },
                    {
                      attachmentName: 'expected_file.txt',
                      attachmentContext: 'add me in the chat !',
                      isFromUser: false,
                      notCounted: false,
                    },
                    { content: 'un message', isFromUser: true, notCounted: false },
                    {
                      content: "coucou c'est super\nle couscous c plutot bon mais la paella c pas mal aussi\n",
                      isFromUser: false,
                      notCounted: false,
                    },
                  ],
                });
                expect(llmPostPromptScope.isDone()).to.be.true;
              },
            );
          });
        });
      });
    });

    context('when no prompt is provided', function () {
      context('when no attachmentName is provided', function () {
        it('should throw a NoAttachmentNorMessageProvidedError', async function () {
          // given
          const chat = new Chat({
            id: 'chatId',
            userId: 123,
            configurationId: 'uneConfigQuiExist',
            configuration: new Configuration({}),
            hasAttachmentContextBeenAdded: false,
            messages: [
              new Message({ content: 'coucou user1', isFromUser: true }),
              new Message({ content: 'coucou LLM2', isFromUser: false }),
            ],
          });
          await chatTemporaryStorage.save({
            key: chat.id,
            value: chat.toDTO(),
            expirationDelaySeconds: ms('24h'),
          });

          // when
          const err = await catchErr(promptChat)({
            chatId: 'chatId',
            userId: 123,
            message: null,
            attachmentName: null,
            ...dependencies,
          });

          // then
          expect(err).to.be.instanceOf(NoAttachmentNorMessageProvidedError);
          expect(err.message).to.equal('At least a message or an attachment, if applicable, must be provided');
        });
      });

      context('when attachmentName is provided', function () {
        context('when no attachmentName is expected for the given configuration', function () {
          it('should throw a NoAttachmentNeededError', async function () {
            // given
            const chat = new Chat({
              id: 'chatId',
              userId: 123,
              configurationId: 'uneConfigQuiExist',
              configuration: new Configuration({
                llm: {
                  historySize: 123,
                },
                challenge: {
                  inputMaxPrompts: 2,
                  inputMaxChars: 255,
                },
              }),
              hasAttachmentContextBeenAdded: false,
              messages: [
                new Message({ content: 'coucou user1', isFromUser: true }),
                new Message({ content: 'coucou LLM2', isFromUser: false }),
                new Message({ content: 'coucou user2', isFromUser: true }),
              ],
            });
            await chatTemporaryStorage.save({
              key: chat.id,
              value: chat.toDTO(),
              expirationDelaySeconds: ms('24h'),
            });

            // when
            const err = await catchErr(promptChat)({
              chatId: 'chatId',
              userId: 123,
              message: null,
              attachmentName: 'un_attachment.pdf',
              ...dependencies,
            });

            // then
            expect(err).to.be.instanceOf(NoAttachmentNeededError);
            expect(err.message).to.equal(
              'Attachment has been provided but is not expected for the given configuration',
            );
          });
        });

        context('when attachmentName is not the expected one for the given configuration', function () {
          it(
            'should return a stream which will contain the invalid attachment event while ' +
              'ignoring the invalid attachmentName by not adding anything to the context',
            async function () {
              // given
              const chat = new Chat({
                id: 'chatId',
                userId: 123,
                configurationId: 'uneConfigQuiExist',
                configuration: new Configuration({
                  llm: {
                    historySize: 123,
                  },
                  challenge: {
                    inputMaxPrompts: 100,
                    inputMaxChars: 255,
                  },
                  attachment: {
                    name: 'expected_file.txt',
                    context: 'add me in the chat !',
                  },
                }),
                hasAttachmentContextBeenAdded: false,
                messages: [
                  new Message({ content: 'coucou user1', isFromUser: true }),
                  new Message({ content: 'coucou LLM1', isFromUser: false }),
                ],
              });
              await chatTemporaryStorage.save({
                key: chat.id,
                value: chat.toDTO(),
                expirationDelaySeconds: ms('24h'),
              });

              // when
              const stream = await promptChat({
                chatId: 'chatId',
                userId: 123,
                message: null,
                attachmentName: 'invalid_file.txt',
                ...dependencies,
              });

              // then
              const parts = [];
              const decoder = new TextDecoder();
              for await (const chunk of stream) {
                parts.push(decoder.decode(chunk));
              }
              const llmResponse = parts.join('');
              expect(llmResponse).to.deep.equal('event: attachment-failure\ndata: \n\n');
              expect(await chatTemporaryStorage.get('chatId')).to.deep.equal({
                id: 'chatId',
                userId: 123,
                configurationId: 'uneConfigQuiExist',
                configuration: {
                  llm: {
                    historySize: 123,
                  },
                  challenge: {
                    inputMaxPrompts: 100,
                    inputMaxChars: 255,
                  },
                  attachment: {
                    name: 'expected_file.txt',
                    context: 'add me in the chat !',
                  },
                },
                hasAttachmentContextBeenAdded: false,
                messages: [
                  { content: 'coucou user1', isFromUser: true, notCounted: false },
                  { content: 'coucou LLM1', isFromUser: false, notCounted: false },
                ],
              });
            },
          );
        });

        context('when attachmentName is the expected one for the given configuration', function () {
          context('when the context for this attachmentName has already been added', function () {
            it(
              'should return a stream which will contain the attachment event while ' +
                'not adding the attachment context in the conversation a second time',
              async function () {
                // given
                const chat = new Chat({
                  id: 'chatId',
                  userId: 123,
                  configurationId: 'uneConfigQuiExist',
                  configuration: new Configuration({
                    llm: {
                      historySize: 123,
                    },
                    challenge: {
                      inputMaxPrompts: 100,
                      inputMaxChars: 255,
                    },
                    attachment: {
                      name: 'expected_file.txt',
                      context: 'add me in the chat !',
                    },
                  }),
                  hasAttachmentContextBeenAdded: true,
                  messages: [
                    new Message({ content: 'coucou user1', isFromUser: true }),
                    new Message({ content: 'coucou LLM1', isFromUser: false }),
                    new Message({
                      content:
                        'Ajoute le fichier fictif "expected_file.txt" à ton contexte. Voici le contenu du fichier :\nadd me in the chat !',
                      isFromUser: true,
                    }),
                    new Message({
                      content: 'Le contenu du fichier fictif a été ajouté au contexte.',
                      isFromUser: false,
                    }),
                    new Message({ content: 'coucou user2', isFromUser: true }),
                    new Message({ content: 'coucou LLM2', isFromUser: false }),
                  ],
                });
                await chatTemporaryStorage.save({
                  key: chat.id,
                  value: chat.toDTO(),
                  expirationDelaySeconds: ms('24h'),
                });

                // when
                const stream = await promptChat({
                  chatId: 'chatId',
                  userId: 123,
                  message: null,
                  attachmentName: 'expected_file.txt',
                  ...dependencies,
                });

                // then
                const parts = [];
                const decoder = new TextDecoder();
                for await (const chunk of stream) {
                  parts.push(decoder.decode(chunk));
                }
                const llmResponse = parts.join('');
                expect(llmResponse).to.deep.equal('event: attachment-success\ndata: \n\n');
                expect(await chatTemporaryStorage.get('chatId')).to.deep.equal({
                  id: 'chatId',
                  userId: 123,
                  configurationId: 'uneConfigQuiExist',
                  configuration: {
                    llm: {
                      historySize: 123,
                    },
                    challenge: {
                      inputMaxPrompts: 100,
                      inputMaxChars: 255,
                    },
                    attachment: {
                      name: 'expected_file.txt',
                      context: 'add me in the chat !',
                    },
                  },
                  hasAttachmentContextBeenAdded: true,
                  messages: [
                    { content: 'coucou user1', isFromUser: true, notCounted: false },
                    { content: 'coucou LLM1', isFromUser: false, notCounted: false },
                    {
                      content:
                        'Ajoute le fichier fictif "expected_file.txt" à ton contexte. Voici le contenu du fichier :\nadd me in the chat !',
                      isFromUser: true,
                      notCounted: false,
                    },
                    {
                      content: 'Le contenu du fichier fictif a été ajouté au contexte.',
                      isFromUser: false,
                      notCounted: false,
                    },
                    { content: 'coucou user2', isFromUser: true, notCounted: false },
                    { content: 'coucou LLM2', isFromUser: false, notCounted: false },
                  ],
                });
              },
            );
          });

          context('when the context for this attachmentName has not been added yet', function () {
            it(
              'should return a stream which will contain the attachment event while ' +
                'adding the attachment context in the conversation',
              async function () {
                // given
                const chat = new Chat({
                  id: 'chatId',
                  userId: 123,
                  configurationId: 'uneConfigQuiExist',
                  configuration: new Configuration({
                    llm: {
                      historySize: 123,
                    },
                    challenge: {
                      inputMaxPrompts: 100,
                      inputMaxChars: 255,
                    },
                    attachment: {
                      name: 'expected_file.txt',
                      context: 'add me in the chat !',
                    },
                  }),
                  hasAttachmentContextBeenAdded: false,
                  messages: [
                    new Message({ content: 'coucou user1', isFromUser: true }),
                    new Message({ content: 'coucou LLM1', isFromUser: false }),
                  ],
                });
                await chatTemporaryStorage.save({
                  key: chat.id,
                  value: chat.toDTO(),
                  expirationDelaySeconds: ms('24h'),
                });

                // when
                const stream = await promptChat({
                  chatId: 'chatId',
                  userId: 123,
                  message: null,
                  attachmentName: 'expected_file.txt',
                  ...dependencies,
                });

                // then
                const parts = [];
                const decoder = new TextDecoder();
                for await (const chunk of stream) {
                  parts.push(decoder.decode(chunk));
                }
                const llmResponse = parts.join('');
                expect(llmResponse).to.deep.equal('event: attachment-success\ndata: \n\n');
                expect(await chatTemporaryStorage.get('chatId')).to.deep.equal({
                  id: 'chatId',
                  userId: 123,
                  configurationId: 'uneConfigQuiExist',
                  configuration: {
                    llm: {
                      historySize: 123,
                    },
                    challenge: {
                      inputMaxPrompts: 100,
                      inputMaxChars: 255,
                    },
                    attachment: {
                      name: 'expected_file.txt',
                      context: 'add me in the chat !',
                    },
                  },
                  hasAttachmentContextBeenAdded: true,
                  messages: [
                    { content: 'coucou user1', isFromUser: true, notCounted: false },
                    { content: 'coucou LLM1', isFromUser: false, notCounted: false },
                    {
                      attachmentName: 'expected_file.txt',
                      isFromUser: true,
                      notCounted: false,
                    },
                    {
                      attachmentName: 'expected_file.txt',
                      attachmentContext: 'add me in the chat !',
                      isFromUser: false,
                      notCounted: false,
                    },
                  ],
                });
              },
            );
          });
        });
      });
    });
  });
});
