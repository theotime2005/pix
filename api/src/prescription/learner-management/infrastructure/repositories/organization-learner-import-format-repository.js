import { ORGANIZATION_FEATURE } from '../../../../shared/domain/constants.js';
import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { OrganizationLearnerImportFormat } from '../../domain/models/OrganizationLearnerImportFormat.js';

function _toDomain(data) {
  return new OrganizationLearnerImportFormat(data);
}

const get = async function (organizationId) {
  const trx = DomainTransaction.getConnection();
  const configResult = await trx('organization-features')
    .select('params')
    .join('features', function () {
      this.on('features.id', 'organization-features.featureId').onVal(
        'features.key',
        ORGANIZATION_FEATURE.LEARNER_IMPORT.key,
      );
    })
    .where({ organizationId })
    .first();

  if (!configResult) return null;

  const result = await trx('organization-learner-import-formats')
    .where('id', configResult.params.organizationLearnerImportFormatId)
    .first();

  if (!result) return null;

  return _toDomain(result);
};

/**
 * @type {function}
 * @param {Object} params
 * @param {Array|Object} params.organizationLearnerImportFormats
 * @return {Promise<void>}
 */
const updateAllByName = async function ({ organizationLearnerImportFormats }) {
  const knexConn = DomainTransaction.getConnection();
  const updatedAt = new Date();

  for (const organizationLearnerImport of organizationLearnerImportFormats) {
    await knexConn('organization-learner-import-formats')
      .where({ name: organizationLearnerImport.name })
      .update({ fileType: organizationLearnerImport.fileType, config: organizationLearnerImport.config, updatedAt });
  }
};

export { get, updateAllByName };
