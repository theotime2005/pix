import crypto from 'node:crypto';

import { ModuleDoesNotExistError } from '../../../../src/devcomp/domain/errors.js';
import { Module } from '../../../../src/devcomp/domain/models/module/Module.js';
import moduleDatasource from '../../../../src/devcomp/infrastructure/datasources/learning-content/module-datasource.js';
import { ModuleFactory } from '../../../../src/devcomp/infrastructure/factories/module-factory.js';
import * as moduleRepository from '../../../../src/devcomp/infrastructure/repositories/module-repository.js';
import { NotFoundError } from '../../../../src/shared/domain/errors.js';
import { catchErr, expect, sinon } from '../../../test-helper.js';

describe('Integration | DevComp | Repositories | ModuleRepository', function () {
  describe('#getAllByIds', function () {
    it('should return all modules with their version', async function () {
      // given
      const modulesIds = ['f7b3a2e1-0d5c-4c6c-9c4d-1a3d8f7e9f5d', '6282925d-4775-4bca-b513-4c3009ec5886'];
      const firstModule = {
        id: modulesIds[0],
        slug: 'getAllByIdsModuleSlug1',
        title: 'Bien écrire son adresse mail',
        isBeta: true,
        details: {
          image: 'https://images.pix.fr/modulix/bien-ecrire-son-adresse-mail-details.svg',
          description:
            'Apprendre à rédiger correctement une adresse e-mail pour assurer une meilleure communication et éviter les erreurs courantes.',
          duration: 12,
          level: 'Débutant',
          tabletSupport: 'comfortable',
          objectives: [
            'Écrire une adresse mail correctement, en évitant les erreurs courantes',
            'Connaître les parties d’une adresse mail et les identifier sur des exemples',
            'Comprendre les fonctions des parties d’une adresse mail',
          ],
        },
        grains: [
          {
            id: 'z1f3c8c7-6d5c-4c6c-9c4d-1a3d8f7e9f5d',
            type: 'lesson',
            title: 'Explications : les parties d’une adresse mail',
            components: [
              {
                type: 'element',
                element: {
                  id: 'd9e8a7b6-5c4d-3e2f-1a0b-9f8e7d6c5b4a',
                  type: 'text',
                  content:
                    "<h3 class='screen-reader-only'>L'arobase</h3><p>L’arobase est dans toutes les adresses mails. Il sépare l’identifiant et le fournisseur d’adresse mail.</p><p><span aria-hidden='true'>🇬🇧</span> En anglais, ce symbole se lit <i lang='en'>“at”</i> qui veut dire “chez”.</p><p><span aria-hidden='true'>🤔</span> Le saviez-vous : c’est un symbole qui était utilisé bien avant l’informatique ! Par exemple, pour compter des quantités.</p>",
                },
              },
            ],
          },
        ],
      };
      const secondModule = {
        id: modulesIds[1],
        slug: 'getAllByIdsModuleSlug2',
        title: 'Bac à sable',
        isBeta: true,
        details: {
          image: 'https://assets.pix.org/modules/placeholder-details.svg',
          description:
            "<p>Ce module est dédié à des tests internes à Pix.</p><p>Il contient normalement l'intégralité des fonctionnalités disponibles à date.</p>",
          duration: 5,
          level: 'Débutant',
          tabletSupport: 'inconvenient',
          objectives: ['Non régression fonctionnelle'],
        },
        grains: [
          {
            id: 'z1f3c8c7-6d5c-4c6c-9c4d-1a3d8f7e9f5d',
            type: 'lesson',
            title: 'Explications : les parties d’une adresse mail',
            components: [
              {
                type: 'element',
                element: {
                  id: 'd9e8a7b6-5c4d-3e2f-1a0b-9f8e7d6c5b4a',
                  type: 'text',
                  content:
                    "<h3 class='screen-reader-only'>L'arobase</h3><p>L’arobase est dans toutes les adresses mails. Il sépare l’identifiant et le fournisseur d’adresse mail.</p><p><span aria-hidden='true'>🇬🇧</span> En anglais, ce symbole se lit <i lang='en'>“at”</i> qui veut dire “chez”.</p><p><span aria-hidden='true'>🤔</span> Le saviez-vous : c’est un symbole qui était utilisé bien avant l’informatique ! Par exemple, pour compter des quantités.</p>",
                },
              },
            ],
          },
        ],
      };

      const moduleDatasourceStub = {
        getAllByIds: sinon.stub(),
      };
      moduleDatasourceStub.getAllByIds.withArgs(modulesIds).resolves([firstModule, secondModule]);

      const version = Symbol('version');
      const digestStub = sinon.stub().returns(version);
      const updateStub = sinon.stub();
      sinon.stub(crypto, 'createHash').returns({
        copy: () => {
          return {
            digest: digestStub,
          };
        },
        update: updateStub,
      });

      // when
      const modules = await moduleRepository.getAllByIds({
        ids: modulesIds,
        moduleDatasource: moduleDatasourceStub,
      });

      // then
      expect(modules).to.have.lengthOf(2);
      modules.forEach((module) => {
        expect(module).to.be.instanceOf(Module);
        expect(module.version).to.equal(version);
      });
    });

    it('should throw a "NotFoundError" when a module does not exist', async function () {
      // given
      const notExistingModuleIds = ['not-existing-module-id-1', 'not-existing-module-id-2'];
      const expectedErrorMessage = `Modules with ids not found : ${notExistingModuleIds}`;
      const moduleDatasourceStub = {
        getAllByIds: sinon.stub(),
      };
      moduleDatasourceStub.getAllByIds
        .withArgs(notExistingModuleIds)
        .throws(new ModuleDoesNotExistError(expectedErrorMessage));

      // when
      const error = await catchErr(moduleRepository.getAllByIds)({
        ids: notExistingModuleIds,
        moduleDatasource: moduleDatasourceStub,
      });

      // then
      expect(error).to.be.instanceOf(NotFoundError);
      expect(error.message).to.equal(expectedErrorMessage);
    });

    it('should throw a "NotFoundError" if the module instanciation throws an error', async function () {
      // given
      const modulesIds = ['f7b3a2e1-0d5c-4c6c-9c4d-1a3d8f7e9f5d'];
      const module = {
        id: modulesIds[0],
      };

      const moduleDatasourceStub = {
        getAllByIds: sinon.stub(),
      };
      moduleDatasourceStub.getAllByIds.withArgs(modulesIds).resolves([module]);

      const version = Symbol('version');
      const digestStub = sinon.stub().returns(version);
      const updateStub = sinon.stub();
      sinon.stub(crypto, 'createHash').returns({
        copy: () => {
          return {
            digest: digestStub,
          };
        },
        update: updateStub,
      });

      // when
      const error = await catchErr(moduleRepository.getAllByIds)({
        ids: modulesIds,
        moduleDatasource: moduleDatasourceStub,
      });

      // then
      expect(error).to.be.instanceOf(NotFoundError);
    });
  });

  describe('#getById', function () {
    describe('errors', function () {
      it('should throw a NotFoundError if the module does not exist', async function () {
        // given
        const nonExistingModuleSlug = 'uuid-dresser-des-pokemons';

        // when
        const error = await catchErr(moduleRepository.getById)({ slug: nonExistingModuleSlug, moduleDatasource });

        // then
        expect(error).to.be.instanceOf(NotFoundError);
      });

      it('should throw a NotFoundError if the module instanciation throw an error', async function () {
        // given
        const moduleDatasourceStub = {
          getById: async () => {
            return {
              id: 1,
              slug: 'module-with-error',
            };
          },
        };

        // when
        const error = await catchErr(moduleRepository.getById)({
          id: 1,
          moduleDatasource: moduleDatasourceStub,
        });

        // then
        expect(error).not.to.be.instanceOf(NotFoundError);
      });
    });

    it('should return a Module instance with its version', async function () {
      const existingModuleId = 'f7b3a2e1-0d5c-4c6c-9c4d-1a3d8f7e9f5d';
      const expectedFoundModule = {
        id: existingModuleId,
        slug: 'existingModuleSlug',
        title: 'Bien écrire son adresse mail',
        isBeta: true,
        details: {
          image: 'https://images.pix.fr/modulix/bien-ecrire-son-adresse-mail-details.svg',
          description:
            'Apprendre à rédiger correctement une adresse e-mail pour assurer une meilleure communication et éviter les erreurs courantes.',
          duration: 12,
          level: 'Débutant',
          tabletSupport: 'comfortable',
          objectives: [
            'Écrire une adresse mail correctement, en évitant les erreurs courantes',
            'Connaître les parties d’une adresse mail et les identifier sur des exemples',
            'Comprendre les fonctions des parties d’une adresse mail',
          ],
        },
        grains: [
          {
            id: 'z1f3c8c7-6d5c-4c6c-9c4d-1a3d8f7e9f5d',
            type: 'lesson',
            title: 'Explications : les parties d’une adresse mail',
            components: [
              {
                type: 'element',
                element: {
                  id: 'd9e8a7b6-5c4d-3e2f-1a0b-9f8e7d6c5b4a',
                  type: 'text',
                  content:
                    "<h3 class='screen-reader-only'>L'arobase</h3><p>L’arobase est dans toutes les adresses mails. Il sépare l’identifiant et le fournisseur d’adresse mail.</p><p><span aria-hidden='true'>🇬🇧</span> En anglais, ce symbole se lit <i lang='en'>“at”</i> qui veut dire “chez”.</p><p><span aria-hidden='true'>🤔</span> Le saviez-vous : c’est un symbole qui était utilisé bien avant l’informatique ! Par exemple, pour compter des quantités.</p>",
                },
              },
            ],
          },
        ],
      };
      const moduleDatasourceStub = {
        getById: sinon.stub(),
      };
      moduleDatasourceStub.getById.withArgs(existingModuleId).resolves(expectedFoundModule);
      sinon.spy(ModuleFactory, 'build');

      const version = Symbol('version');
      const digestStub = sinon.stub().returns(version);
      const updateStub = sinon.stub();
      const createHashStub = sinon.stub(crypto, 'createHash').returns({
        copy: () => {
          return {
            digest: digestStub,
          };
        },
        update: updateStub,
      });

      // when
      const module = await moduleRepository.getById({
        id: existingModuleId,
        moduleDatasource: moduleDatasourceStub,
      });

      // then
      expect(ModuleFactory.build).to.have.been.calledWith({ ...expectedFoundModule, version });
      expect(module).to.be.instanceof(Module);
      expect(createHashStub).to.have.been.calledOnceWith('sha256');
      expect(updateStub).to.have.been.calledOnceWith(JSON.stringify(expectedFoundModule));
      expect(digestStub).to.have.been.calledOnceWith('hex');
    });
  });

  describe('#getBySlug', function () {
    describe('errors', function () {
      it('should throw a NotFoundError if the module does not exist', async function () {
        // given
        const nonExistingModuleSlug = 'dresser-des-pokemons';

        // when
        const error = await catchErr(moduleRepository.getBySlug)({ slug: nonExistingModuleSlug, moduleDatasource });

        // then
        expect(error).to.be.instanceOf(NotFoundError);
      });

      it('should throw a NotFoundError if the module instanciation throw an error', async function () {
        // given
        const moduleSlug = 'incomplete-module';
        const moduleDatasourceStub = {
          getBySlug: async () => {
            return {
              id: 1,
              slug: moduleSlug,
            };
          },
        };

        // when
        const error = await catchErr(moduleRepository.getBySlug)({
          slug: moduleSlug,
          moduleDatasource: moduleDatasourceStub,
        });

        // then
        expect(error).not.to.be.instanceOf(NotFoundError);
      });
    });

    it('should return a Module instance with its version', async function () {
      const existingModuleSlug = 'bien-ecrire-son-adresse-mail';
      const expectedFoundModule = {
        id: 'f7b3a2e1-0d5c-4c6c-9c4d-1a3d8f7e9f5d',
        slug: existingModuleSlug,
        title: 'Bien écrire son adresse mail',
        isBeta: true,
        details: {
          image: 'https://images.pix.fr/modulix/bien-ecrire-son-adresse-mail-details.svg',
          description:
            'Apprendre à rédiger correctement une adresse e-mail pour assurer une meilleure communication et éviter les erreurs courantes.',
          duration: 12,
          level: 'Débutant',
          tabletSupport: 'comfortable',
          objectives: [
            'Écrire une adresse mail correctement, en évitant les erreurs courantes',
            'Connaître les parties d’une adresse mail et les identifier sur des exemples',
            'Comprendre les fonctions des parties d’une adresse mail',
          ],
        },
        grains: [
          {
            id: 'z1f3c8c7-6d5c-4c6c-9c4d-1a3d8f7e9f5d',
            type: 'lesson',
            title: 'Explications : les parties d’une adresse mail',
            components: [
              {
                type: 'element',
                element: {
                  id: 'd9e8a7b6-5c4d-3e2f-1a0b-9f8e7d6c5b4a',
                  type: 'text',
                  content:
                    "<h3 class='screen-reader-only'>L'arobase</h3><p>L’arobase est dans toutes les adresses mails. Il sépare l’identifiant et le fournisseur d’adresse mail.</p><p><span aria-hidden='true'>🇬🇧</span> En anglais, ce symbole se lit <i lang='en'>“at”</i> qui veut dire “chez”.</p><p><span aria-hidden='true'>🤔</span> Le saviez-vous : c’est un symbole qui était utilisé bien avant l’informatique ! Par exemple, pour compter des quantités.</p>",
                },
              },
            ],
          },
        ],
      };
      const moduleDatasourceStub = {
        getBySlug: sinon.stub(),
      };
      moduleDatasourceStub.getBySlug.withArgs(existingModuleSlug).resolves(expectedFoundModule);
      sinon.spy(ModuleFactory, 'build');

      const version = Symbol('version');
      const digestStub = sinon.stub().returns(version);
      const updateStub = sinon.stub();
      const createHashStub = sinon.stub(crypto, 'createHash').returns({
        copy: () => {
          return {
            digest: digestStub,
          };
        },
        update: updateStub,
      });

      // when
      const module = await moduleRepository.getBySlug({
        slug: existingModuleSlug,
        moduleDatasource: moduleDatasourceStub,
      });

      // then
      expect(ModuleFactory.build).to.have.been.calledWith({ ...expectedFoundModule, version });
      expect(module).to.be.instanceof(Module);
      expect(createHashStub).to.have.been.calledOnceWith('sha256');
      expect(updateStub).to.have.been.calledOnceWith(JSON.stringify(expectedFoundModule));
      expect(digestStub).to.have.been.calledOnceWith('hex');
    });
  });

  describe('#list', function () {
    describe('errors', function () {
      describe('if there are no duplicated IDs in modules content', function () {
        it('should result an empty array of duplicated IDs ', async function () {
          const modules = await moduleDatasource.list();
          const ids = [];
          const duplicateIds = new Set();
          for (const module of modules) {
            if (ids.includes(module.id)) {
              duplicateIds.add(module.id);
            }
            ids.push(module.id);

            for (const grain of module.grains) {
              if (ids.includes(grain.id)) {
                duplicateIds.add(grain.id);
              }
              ids.push(grain.id);

              for (const component of grain.components) {
                switch (component.type) {
                  case 'element':
                    if (ids.includes(component.element.id)) {
                      duplicateIds.add(component.element.id);
                    }
                    if (component.element.type === 'flashcards') {
                      for (const card of component.element.cards) {
                        if (ids.includes(card.id)) {
                          duplicateIds.add(card.id);
                        }
                        ids.push(card.id);
                      }
                    }
                    ids.push(component.element.id);
                    break;
                  case 'stepper':
                    for (const step of component.steps) {
                      for (const element of step.elements) {
                        if (ids.includes(element.id)) {
                          duplicateIds.add(element.id);
                        }
                        if (element.type === 'flashcards') {
                          for (const card of element.cards) {
                            if (ids.includes(card.id)) {
                              duplicateIds.add(card.id);
                            }
                            ids.push(card.id);
                          }
                        }
                        ids.push(element.id);
                      }
                    }
                    break;
                }
              }
            }
          }

          expect([...duplicateIds]).to.deep.equal([]);
        });
      });
    });

    it('should return a list of Module instances', async function () {
      const existingModuleSlug = 'bien-ecrire-son-adresse-mail';
      const expectedFoundModule = {
        id: 'f7b3a2e1-0d5c-4c6c-9c4d-1a3d8f7e9f5d',
        slug: existingModuleSlug,
        title: 'Bien écrire son adresse mail',
        isBeta: true,
        details: {
          image: 'https://images.pix.fr/modulix/bien-ecrire-son-adresse-mail-details.svg',
          description:
            'Apprendre à rédiger correctement une adresse e-mail pour assurer une meilleure communication et éviter les erreurs courantes.',
          duration: 12,
          level: 'Débutant',
          tabletSupport: 'comfortable',
          objectives: [
            'Écrire une adresse mail correctement, en évitant les erreurs courantes',
            'Connaître les parties d’une adresse mail et les identifier sur des exemples',
            'Comprendre les fonctions des parties d’une adresse mail',
          ],
        },
        grains: [
          {
            id: 'z1f3c8c7-6d5c-4c6c-9c4d-1a3d8f7e9f5d',
            type: 'lesson',
            title: 'Explications : les parties d’une adresse mail',
            components: [
              {
                type: 'element',
                element: {
                  id: 'd9e8a7b6-5c4d-3e2f-1a0b-9f8e7d6c5b4a',
                  type: 'text',
                  content:
                    "<h3 class='screen-reader-only'>L'arobase</h3><p>L’arobase est dans toutes les adresses mails. Il sépare l’identifiant et le fournisseur d’adresse mail.</p><p><span aria-hidden='true'>🇬🇧</span> En anglais, ce symbole se lit <i lang='en'>“at”</i> qui veut dire “chez”.</p><p><span aria-hidden='true'>🤔</span> Le saviez-vous : c’est un symbole qui était utilisé bien avant l’informatique ! Par exemple, pour compter des quantités.</p>",
                },
              },
            ],
          },
        ],
      };
      const moduleDatasourceStub = {
        list: sinon.stub(),
      };
      moduleDatasourceStub.list.resolves([expectedFoundModule]);
      sinon.spy(ModuleFactory, 'build');

      // when
      const modules = await moduleRepository.list({ moduleDatasource: moduleDatasourceStub });

      // then
      expect(ModuleFactory.build).to.have.been.calledWith(expectedFoundModule);
      expect(modules).to.be.an('array');
      expect(modules[0]).to.be.instanceof(Module);
    });
  });
});
