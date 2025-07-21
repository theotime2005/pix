import { Readable } from 'node:stream';

import { Chat } from '../../../../src/llm/domain/models/Chat.js';
import { Configuration } from '../../../../src/llm/domain/models/Configuration.js';
import { CHAT_STORAGE_PREFIX } from '../../../../src/llm/infrastructure/repositories/chat-repository.js';
import { featureToggles } from '../../../../src/shared/infrastructure/feature-toggles/index.js';
import { temporaryStorage } from '../../../../src/shared/infrastructure/key-value-storages/index.js';
import {
  createServer,
  expect,
  generateValidRequestAuthorizationHeaderForApplication,
  nock,
} from '../../../test-helper.js';

const chatTemporaryStorage = temporaryStorage.withPrefix(CHAT_STORAGE_PREFIX);

describe('Acceptance | Route | llm-preview', function () {
  let server;

  beforeEach(async function () {
    server = await createServer();
    await featureToggles.set('isEmbedLLMEnabled', true);
  });

  afterEach(async function () {
    await chatTemporaryStorage.flushAll();
  });

  describe('POST /api/llm/preview/chats', function () {
    context('when request is not authenticated', function () {
      it('should throw a 401', async function () {
        // when
        const response = await server.inject({
          method: 'POST',
          url: '/api/llm/preview/chats',
        });

        // then
        expect(response.statusCode).to.equal(401);
      });
    });

    context('when application token does not have llm-preview scope', function () {
      it('should throw a 403', async function () {
        // given
        const token = generateValidRequestAuthorizationHeaderForApplication('pix-llm', 'Pix LLM', 'wrong-scope');

        // when
        const response = await server.inject({
          method: 'POST',
          url: '/api/llm/preview/chats',
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        // then
        expect(response.statusCode).to.equal(403);
      });
    });

    context('when payload’s configuration is not valid', function () {
      it('should throw a 400', async function () {
        // given
        const token = generateValidRequestAuthorizationHeaderForApplication('pix-llm', 'Pix LLM', 'llm-preview');

        // when
        const response = await server.inject({
          method: 'POST',
          url: '/api/llm/preview/chats',
          headers: {
            authorization: `Bearer ${token}`,
          },
          payload: {
            configuration: {
              name: 'Config de test',
              challenge: {
                inputMaxChars: 1024,
                inputMaxPrompts: 5,
              },
            },
          },
        });

        // then
        expect(response.statusCode).to.equal(400);
      });
    });

    context('when isEmbedLLMEnabled feature toggle is false', function () {
      beforeEach(async function () {
        await featureToggles.set('isEmbedLLMEnabled', false);
      });

      it('should throw a 503', async function () {
        // given
        const token = generateValidRequestAuthorizationHeaderForApplication('pix-llm', 'Pix LLM', 'llm-preview');

        // when
        const response = await server.inject({
          method: 'POST',
          url: '/api/llm/preview/chats',
          headers: {
            authorization: `Bearer ${token}`,
          },
          payload: {
            configuration: {
              name: 'Config de test',
              llm: {
                historySize: 10,
              },
              challenge: {
                inputMaxChars: 1024,
                inputMaxPrompts: 5,
              },
            },
          },
        });

        // then
        expect(response.statusCode).to.equal(503);
      });
    });

    it('should throw a 201', async function () {
      // given
      const token = generateValidRequestAuthorizationHeaderForApplication('pix-llm', 'Pix LLM', 'llm-preview');

      // when
      const response = await server.inject({
        method: 'POST',
        url: '/api/llm/preview/chats',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          configuration: {
            name: 'Config de test',
            llm: {
              historySize: 10,
            },
            challenge: {
              inputMaxChars: 1024,
              inputMaxPrompts: 5,
            },
          },
        },
      });

      // then
      expect(response.statusCode).to.equal(201);
      expect(response.headers)
        .to.have.property('location')
        .that.matches(
          /^https:\/\/test\.app\.pix\.fr\/llm\/preview\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );

      expect(await chatTemporaryStorage.get(response.headers.location.split('/').at(-1))).to.deep.contain({
        configuration: {
          name: 'Config de test',
          llm: {
            historySize: 10,
          },
          challenge: {
            inputMaxChars: 1024,
            inputMaxPrompts: 5,
          },
        },
        hasAttachmentContextBeenAdded: false,
        messages: [],
      });
    });
  });

  describe('GET /api/llm/preview/chats/{chatId}', function () {
    context('when isEmbedLLMEnabled feature toggle is false', function () {
      beforeEach(async function () {
        await featureToggles.set('isEmbedLLMEnabled', false);
      });

      it('should throw a 503', async function () {
        // when
        const response = await server.inject({
          method: 'GET',
          url: '/api/llm/preview/embed/llm/chats/123e4567-e89b-12d3-a456-426614174000',
        });

        // then
        expect(response.statusCode).to.equal(503);
      });
    });

    context('when chatId is unknown', function () {
      it('returns status code 404', async function () {
        // when
        const response = await server.inject({
          method: 'GET',
          url: '/api/llm/preview/embed/llm/chats/00000000-0000-0000-0000-000000000000',
        });

        // then
        expect(response.statusCode).to.equal(404);
      });
    });

    context('when chat belongs to a user', function () {
      it('returns status code 403', async function () {
        // given
        await chatTemporaryStorage.save({
          key: '123e4567-e89b-12d3-a456-426614174000',
          value: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            userId: 123,
            configurationId: 'some-config-id',
            configuration: {
              llm: {
                historySize: 10,
              },
              challenge: {
                inputMaxChars: 500,
                inputMaxPrompts: 4,
              },
            },
            hasAttachmentContextBeenAdded: false,
            messages: [],
          },
        });

        // when
        const response = await server.inject({
          method: 'GET',
          url: '/api/llm/preview/embed/llm/chats/123e4567-e89b-12d3-a456-426614174000',
        });

        // then
        expect(response.statusCode).to.equal(403);
      });
    });

    it('returns status code 200 and chat information', async function () {
      // given
      await chatTemporaryStorage.save({
        key: '123e4567-e89b-12d3-a456-426614174000',
        value: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          configuration: {
            llm: {
              historySize: 10,
            },
            challenge: {
              inputMaxChars: 500,
              inputMaxPrompts: 4,
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
        },
      });

      // when
      const response = await server.inject({
        method: 'GET',
        url: '/api/llm/preview/embed/llm/chats/123e4567-e89b-12d3-a456-426614174000',
      });

      // then
      expect(response.statusCode).to.equal(200);
      expect(response.result).to.deep.equal({
        id: '123e4567-e89b-12d3-a456-426614174000',
        inputMaxChars: 500,
        inputMaxPrompts: 3,
        attachmentName: 'expected_file.txt',
        messages: [
          { content: 'coucou user1', attachmentName: undefined, isFromUser: true },
          { content: 'coucou LLM1', attachmentName: undefined, isFromUser: false },
          { content: 'un message', attachmentName: 'expected_file.txt', isFromUser: true },
          {
            content: "coucou c'est super\nle couscous c plutot bon mais la paella c pas mal aussi\n",
            attachmentName: undefined,
            isFromUser: false,
          },
        ],
      });
    });
  });

  describe('POST /api/llm/preview/chats/{chatId}/messages', function () {
    afterEach(async function () {
      await chatTemporaryStorage.flushAll();
    });

    context('when feature toggle is disabled', function () {
      beforeEach(function () {
        return featureToggles.set('isEmbedLLMEnabled', false);
      });

      it('returns a 503 status code', async function () {
        // when
        const response = await server.inject({
          method: 'POST',
          url: '/api/llm/preview/embed/llm/chats/123e4567-e89b-12d3-a456-426614174000/messages',
          payload: { prompt: 'Quelle est la recette de la ratatouille ?' },
        });

        expect(response.statusCode).to.equal(503);
      });
    });

    context('when chat belongs to a user', function () {
      it('returns a 403 status code', async function () {
        // given
        const chat = new Chat({
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: 123,
          configurationId: 'some-config-id',
          configuration: new Configuration({
            llm: {
              historySize: 123,
            },
            challenge: {
              inputMaxChars: 999,
              inputMaxPrompts: 999,
            },
          }),
          hasAttachmentContextBeenAdded: false,
          messages: [],
        });
        await chatTemporaryStorage.save({
          key: '123e4567-e89b-12d3-a456-426614174000',
          value: chat.toDTO(),
        });

        // when
        const response = await server.inject({
          method: 'POST',
          url: '/api/llm/preview/embed/llm/chats/123e4567-e89b-12d3-a456-426614174000/messages',
          payload: { prompt: 'Quelle est la recette de la ratatouille ?' },
        });

        // then
        expect(response.statusCode).to.equal(403);
      });
    });

    it('returns LLM response as stream', async function () {
      // given
      const chat = new Chat({
        id: '123e4567-e89b-12d3-a456-426614174000',
        configuration: new Configuration({
          llm: {
            historySize: 123,
          },
          challenge: {
            inputMaxChars: 999,
            inputMaxPrompts: 999,
          },
          attachment: {
            name: 'expected_file.pdf',
            context: 'some context',
          },
        }),
        hasAttachmentContextBeenAdded: false,
        messages: [],
      });
      await chatTemporaryStorage.save({
        key: '123e4567-e89b-12d3-a456-426614174000',
        value: chat.toDTO(),
      });
      const promptLlmScope = nock('https://llm-test.pix.fr/api')
        .post('/chat', {
          configuration: {
            llm: {
              historySize: 123,
            },
            challenge: {
              inputMaxChars: 999,
              inputMaxPrompts: 999,
            },
            attachment: {
              name: 'expected_file.pdf',
              context: 'some context',
            },
          },
          history: [
            {
              content:
                "<system_notification>L'utilisateur a téléversé une pièce jointe : <attachment_name>expected_file.pdf</attachment_name></system_notification>",
              role: 'user',
            },
            {
              content:
                '<read_attachment_tool>Lecture de la pièce jointe, expected_file.pdf : <attachment_content>some context</attachment_content></read_attachment_tool>',
              role: 'assistant',
            },
          ],
          prompt: 'Quelle est la recette de la ratatouille ?',
        })
        .reply(201, Readable.from(['32:{"message":"coucou c\'est super"}']));

      // when
      const response = await server.inject({
        method: 'POST',
        url: '/api/llm/preview/embed/llm/chats/123e4567-e89b-12d3-a456-426614174000/messages',
        payload: { prompt: 'Quelle est la recette de la ratatouille ?', attachmentName: 'expected_file.pdf' },
      });

      // then
      expect(response.statusCode).to.equal(201);
      expect(promptLlmScope.isDone()).to.be.true;
      expect(response.result).to.deep.equal("event: attachment-success\ndata: \n\ndata: coucou c'est super\n\n");
    });
  });
});
