import crypto from 'node:crypto';

import { NotFoundError } from '../../../shared/domain/errors.js';
import { LearningContentResourceNotFound } from '../../../shared/domain/errors.js';
import { ModuleFactory } from '../factories/module-factory.js';

async function getAllByIds({ ids, moduleDatasource }) {
  try {
    const modules = await moduleDatasource.getAllByIds(ids);

    return modules.map((moduleData) => {
      const version = _computeModuleVersion(moduleData);
      return ModuleFactory.build({ ...moduleData, version });
    });
  } catch (error) {
    throw new NotFoundError(error.message);
  }
}

async function getById({ id, moduleDatasource }) {
  return await _getModule({ ref: 'id', moduleDatasource, query: id });
}

async function getBySlug({ slug, moduleDatasource }) {
  return await _getModule({ ref: 'slug', moduleDatasource, query: slug });
}

async function list({ moduleDatasource }) {
  const modulesData = await moduleDatasource.list();
  return modulesData.map((moduleData) => ModuleFactory.build(moduleData));
}

export { getAllByIds, getById, getBySlug, list };

function _computeModuleVersion(moduleData) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(moduleData));
  return hash.copy().digest('hex');
}

async function _getModule({ ref, moduleDatasource, query }) {
  try {
    const method = ref === 'id' ? moduleDatasource.getById : moduleDatasource.getBySlug;
    const moduleData = await method(query);
    const version = _computeModuleVersion(moduleData);

    return ModuleFactory.build({ ...moduleData, version });
  } catch (e) {
    if (e instanceof LearningContentResourceNotFound) {
      throw new NotFoundError();
    }
    throw e;
  }
}
