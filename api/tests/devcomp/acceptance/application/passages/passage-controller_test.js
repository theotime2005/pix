import { Readable } from 'node:stream';

import ms from 'ms';

import { Chat } from '../../../../../src/llm/domain/models/Chat.js';
import { Configuration } from '../../../../../src/llm/domain/models/Configuration.js';
import { CHAT_STORAGE_PREFIX } from '../../../../../src/llm/infrastructure/repositories/chat-repository.js';
import { featureToggles } from '../../../../../src/shared/infrastructure/feature-toggles/index.js';
import { temporaryStorage } from '../../../../../src/shared/infrastructure/key-value-storages/index.js';
import {
  createServer,
  databaseBuilder,
  expect,
  generateAuthenticatedUserRequestHeaders,
  knex,
  nock,
} from '../../../../test-helper.js';

const chatTemporaryStorage = temporaryStorage.withPrefix(CHAT_STORAGE_PREFIX);

describe('Acceptance | Controller | passage-controller', function () {
  let server;

  beforeEach(async function () {
    server = await createServer();
  });

  describe('POST /api/passages', function () {
    describe('when user is not authenticated', function () {
      it('should create a new passage and response with a 201', async function () {
        // given
        const expectedResponse = {
          type: 'passages',
          attributes: {
            'module-id': 'f7b3a2e1-0d5c-4c6c-9c4d-1a3d8f7e9f5d',
          },
        };

        // when
        const response = await server.inject({
          method: 'POST',
          url: '/api/passages',
          payload: {
            data: {
              type: 'passages',
              attributes: {
                'module-id': 'f7b3a2e1-0d5c-4c6c-9c4d-1a3d8f7e9f5d',
                'occurred-at': new Date('2025-04-30').getTime(),
                'module-version': '6c3b1771db81f7419d18d7c8010e9b62266b62b032868e319d195e52742825e5',
                'sequence-number': 1,
              },
            },
          },
        });

        // then
        expect(response.statusCode).to.equal(201);
        expect(response.result.data.type).to.equal(expectedResponse.type);
        expect(response.result.data.id).to.exist;
        expect(response.result.data.attributes).to.deep.equal(expectedResponse.attributes);
      });
    });

    describe('when user is authenticated', function () {
      it('should create a new passage and response with a 201', async function () {
        // given
        const user = databaseBuilder.factory.buildUser();
        await databaseBuilder.commit();
        const moduleId = 'f7b3a2e1-0d5c-4c6c-9c4d-1a3d8f7e9f5d';
        const expectedResponse = {
          type: 'passages',
          attributes: {
            'module-id': moduleId,
          },
        };

        // when
        const response = await server.inject({
          method: 'POST',
          url: '/api/passages',
          payload: {
            data: {
              type: 'passages',
              attributes: {
                'module-id': 'f7b3a2e1-0d5c-4c6c-9c4d-1a3d8f7e9f5d',
                'occurred-at': new Date('2025-04-30').getTime(),
                'module-version': '6c3b1771db81f7419d18d7c8010e9b62266b62b032868e319d195e52742825e5',
                'sequence-number': 1,
              },
            },
          },
          headers: generateAuthenticatedUserRequestHeaders({ userId: user.id }),
        });

        // then
        const { id: passageId, userId } = await knex('passages').where({ id: response.result.data.id }).first();
        const passageEvents = await knex('passage-events').where({ passageId }).first();

        expect(response.statusCode).to.equal(201);
        expect(response.result.data.type).to.equal(expectedResponse.type);
        expect(response.result.data.id).to.exist;
        expect(response.result.data.attributes).to.deep.equal(expectedResponse.attributes);

        expect(userId).to.equal(user.id);
        expect(passageEvents.type).to.equal('PASSAGE_STARTED');
      });
    });
  });

  describe('POST /api/passages/{passageId}/answers', function () {
    context('when given proposal is the correct answer', function () {
      const cases = [
        {
          case: 'QCU',
          moduleId: 'f7b3a2e1-0d5c-4c6c-9c4d-1a3d8f7e9f5d',
          elementId: '845fe6d7-7ac5-46bb-a5d6-0419148b3978',
          userResponse: ['2'],
          expectedUserResponseValue: '2',
          expectedFeedback: {
            state: 'Bonne réponse&#8239;!&nbsp;🎉',
            diagnosis:
              "<p>Une adresse mail est <strong>unique</strong>.<br>Au moment de la création d'une adresse mail, vous saurez si un identifiant est disponible ou pas.</p>",
          },
          expectedSolution: '2',
        },
        {
          case: 'QROCM-ind',
          moduleId: 'f7b3a2e1-0d5c-4c6c-9c4d-1a3d8f7e9f5d',
          elementId: '8709ad92-093e-447a-a7b6-3223e6171196',
          userResponse: [{ input: 'email', answer: 'naomizao457@yahoo.com' }],
          expectedUserResponseValue: { email: 'naomizao457@yahoo.com' },
          expectedFeedback: {
            state: 'Bravo !&nbsp;\uD83D\uDCAB',
            diagnosis:
              "<p>Tout est dans l'ordre&nbsp;: l'identifiant, l'arobase puis le fournisseur d'adresse mail</p>",
          },
          expectedSolution: {
            email: ['naomizao457@yahoo.com', 'naomizao457@yahoo.fr'],
          },
        },
        {
          case: 'QCM',
          moduleId: '6282925d-4775-4bca-b513-4c3009ec5886',
          elementId: '30701e93-1b4d-4da4-b018-fa756c07d53f',
          userResponse: ['1', '3', '4'],
          expectedUserResponseValue: ['1', '3', '4'],
          expectedFeedback: {
            state: 'Correct&#8239;!',
            diagnosis: '<p>Vous nous avez bien cernés&nbsp;:)</p>',
          },
          expectedSolution: ['1', '3', '4'],
        },
      ];

      cases.forEach((testCase, i) =>
        it(`should return a valid ${testCase.case} element answer`, async function () {
          const passage = databaseBuilder.factory.buildPassage({ id: i + 1, moduleId: testCase.moduleId });
          await databaseBuilder.commit();

          const options = {
            method: 'POST',
            url: `/api/passages/${passage.id}/answers`,
            payload: {
              data: {
                attributes: {
                  'element-id': testCase.elementId,
                  'user-response': testCase.userResponse,
                },
              },
            },
          };

          const response = await server.inject(options);

          expect(response.statusCode).to.equal(201);
          expect(response.result.data.type).to.equal('element-answers');
          expect(response.result.data.attributes['user-response-value']).to.deep.equal(
            testCase.expectedUserResponseValue,
          );
          expect(response.result.data.attributes['element-id']).to.equal(testCase.elementId);
          expect(response.result.included[0].attributes.status).to.equal('ok');
          expect(response.result.included[0].attributes.feedback).to.deep.equal(testCase.expectedFeedback);
          expect(response.result.included[0].attributes.solution).to.deep.equal(testCase.expectedSolution);
        }),
      );
    });
  });

  describe('POST /api/passages/{passageId}/terminate', function () {
    context('when passage is already terminated', function () {
      it('should return a 412', async function () {
        const passage = databaseBuilder.factory.buildPassage({ terminatedAt: new Date() });
        await databaseBuilder.commit();

        const options = {
          method: 'POST',
          url: `/api/passages/${passage.id}/terminate`,
        };

        const response = await server.inject(options);

        expect(response.statusCode).to.equal(412);
      });
    });

    context('when passage is not terminated', function () {
      it('should return a 200 and terminate passage', async function () {
        const passage = databaseBuilder.factory.buildPassage();
        await databaseBuilder.commit();

        const options = {
          method: 'POST',
          url: `/api/passages/${passage.id}/terminate`,
        };

        const response = await server.inject(options);

        expect(response.statusCode).to.equal(200);
        const { terminatedAt } = await knex('passages').where({ id: passage.id }).first();
        expect(terminatedAt).to.be.not.null;
      });
    });
  });

  describe('POST /api/passages/{passageId}/embed/llm/chats', function () {
    let user;

    beforeEach(async function () {
      user = databaseBuilder.factory.buildUser();
      databaseBuilder.factory.buildPassage({ id: 111, userId: user.id }).id;
      await databaseBuilder.commit();
    });

    afterEach(async function () {
      await chatTemporaryStorage.flushAll();
    });

    context('when user is not authenticated', function () {
      it('should throw a 401', async function () {
        // when
        const response = await server.inject({
          method: 'POST',
          url: '/api/passages/111/embed/llm/chats',
          payload: { configId: 'c1SuperConfig2Lespace' },
        });

        expect(response.statusCode).to.equal(401);
      });
    });

    context('when user is authenticated', function () {
      context('when feature toggle is enabled', function () {
        beforeEach(function () {
          return featureToggles.set('isEmbedLLMEnabled', true);
        });

        it('should start a new chat', async function () {
          // given
          const config = {
            llm: {
              historySize: 123,
            },
            challenge: {
              inputMaxChars: 456,
              inputMaxPrompts: 789,
            },
            attachment: {
              name: 'file.txt',
              context: 'context',
            },
          };
          const llmApiScope = nock('https://llm-test.pix.fr/api')
            .get('/configurations/c1SuperConfig2Lespace')
            .reply(200, config);

          // when
          const response = await server.inject({
            method: 'POST',
            url: '/api/passages/111/embed/llm/chats',
            payload: { configId: 'c1SuperConfig2Lespace' },
            headers: generateAuthenticatedUserRequestHeaders({ userId: user.id }),
          });

          // then
          expect(response.statusCode).to.equal(201);
          expect(response.result).to.contain({
            inputMaxChars: 456,
            inputMaxPrompts: 788,
            attachmentName: 'file.txt',
          });
          expect(response.result).to.have.property('id').that.is.a('string').and.not.empty;
          expect(response.result).to.have.property('chatId').that.is.a('string').and.not.empty;
          expect(llmApiScope.isDone()).to.be.true;
        });
      });

      context('when feature toggle is disabled', function () {
        beforeEach(function () {
          return featureToggles.set('isEmbedLLMEnabled', false);
        });

        it('should throw a 503 status code', async function () {
          // when
          const response = await server.inject({
            method: 'POST',
            url: '/api/passages/111/embed/llm/chats',
            payload: { configId: 'c1SuperConfig2Lespace' },
            headers: generateAuthenticatedUserRequestHeaders({ userId: user.id }),
          });

          expect(response.statusCode).to.equal(503);
        });
      });
    });
  });

  describe('POST /api/passages/{passageId}/embed/llm/chats/{chatId}/messages', function () {
    let user;

    beforeEach(async function () {
      user = databaseBuilder.factory.buildUser();
      databaseBuilder.factory.buildPassage({ id: 111, userId: user.id }).id;
      await databaseBuilder.commit();
    });

    afterEach(async function () {
      await chatTemporaryStorage.flushAll();
    });

    context('when user is not authenticated', function () {
      it('should throw a 401', async function () {
        // when
        const response = await server.inject({
          method: 'POST',
          url: '/api/passages/111/embed/llm/chats/cSomeChatId123/messages',
          payload: { prompt: 'Quelle est la recette de la ratatouille ?' },
        });

        expect(response.statusCode).to.equal(401);
      });
    });

    context('when user is authenticated', function () {
      context('when feature toggle is disabled', function () {
        beforeEach(function () {
          return featureToggles.set('isEmbedLLMEnabled', false);
        });

        it('should throw a 503 status code', async function () {
          // when
          const response = await server.inject({
            method: 'POST',
            url: '/api/passages/111/embed/llm/chats/cSomeChatId123/messages',
            payload: { prompt: 'Quelle est la recette de la ratatouille ?' },
            headers: generateAuthenticatedUserRequestHeaders({ userId: user.id }),
          });

          expect(response.statusCode).to.equal(503);
        });
      });

      context('when feature toggle is enabled', function () {
        beforeEach(function () {
          return featureToggles.set('isEmbedLLMEnabled', true);
        });

        it('should receive LLM response as stream', async function () {
          // given
          const chat = new Chat({
            id: 'someChatId123456789',
            userId: user.id,
            configurationId: 'uneConfigQuiExist',
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
            key: 'someChatId123456789',
            value: chat.toDTO(),
            expirationDelaySeconds: ms('24h'),
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
            url: '/api/passages/111/embed/llm/chats/someChatId123456789/messages',
            payload: { prompt: 'Quelle est la recette de la ratatouille ?', attachmentName: 'expected_file.pdf' },
            headers: generateAuthenticatedUserRequestHeaders({ userId: user.id }),
          });

          // then
          expect(response.statusCode).to.equal(201);
          expect(response.result).to.deep.equal("event: attachment-success\ndata: \n\ndata: coucou c'est super\n\n");
          expect(promptLlmScope.isDone()).to.be.true;
        });
      });
    });
  });
});
