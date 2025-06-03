/**
 * @typedef {import('../../../../../src/shared/domain/events/CertificationCancelled.js'} CertificationCancelled
 * @typedef {import('../../../../../src/shared/domain/events/CertificationUncancelled.js'} CertificationUncancelled
 * @typedef {import('./index.js').CertificationEvaluationApi} CertificationEvaluationApi
 */

/**
 * @param {Object} params
 * @param {CertificationCancelled|CertificationUncancelled} params.event
 * @param {CertificationEvaluationApi} params.certificationEvaluationApi
 * @returns {Promise<void>}
 */
export const execute = async ({ event, certificationEvaluationApi }) => {
  return certificationEvaluationApi.rescoreCertification({
    event,
  });
};
