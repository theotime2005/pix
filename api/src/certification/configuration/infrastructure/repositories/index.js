import { injectDependencies } from '../../../../shared/infrastructure/utils/dependency-injection.js';
import * as consolidatedFrameworkRepository from './consolidated-framework-repository.js';
import * as learningContentRepository from './learning-content-repository.js';

/**
 * Using {@link https://jsdoc.app/tags-type "Closure Compiler's syntax"} to document injected dependencies
 *
 * @typedef {consolidatedFrameworkRepository} ConsolidatedFrameworkRepository
 * @typedef {learningContentRepository} LearningContentRepository
 */
const repositoriesWithoutInjectedDependencies = {
  consolidatedFrameworkRepository,
  learningContentRepository,
};

const configurationRepositories = injectDependencies(repositoriesWithoutInjectedDependencies);

export { configurationRepositories };
