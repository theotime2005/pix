import { withTransaction } from '../../../../shared/domain/DomainTransaction.js';

/**
 * @typedef {import('../usecases/index.js').CertificationCompanionAlertRepository} CertificationCompanionAlertRepository
 */

export const createCompanionAlert = withTransaction(
  /**
   * @param {Object} params
   * @param {number} params.assessmentId
   * @param {CertificationCompanionAlertRepository} params.certificationCompanionAlertRepository
   **/
  async function ({ assessmentId, certificationCompanionAlertRepository }) {
    await certificationCompanionAlertRepository.create({ assessmentId });
  },
  {
    isolationLevel: 'serializable',
  },
);
