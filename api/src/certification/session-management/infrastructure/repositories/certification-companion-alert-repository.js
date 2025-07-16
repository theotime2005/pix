import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import {
  CertificationCompanionLiveAlert,
  CertificationCompanionLiveAlertStatus,
} from '../../../shared/domain/models/CertificationCompanionLiveAlert.js';

/**
 *
 * @param {object} params
 * @param {number} params.sessionId
 * @param {number} params.userId
 * @param {object} options
 * @param {import('knex').Knex} options.knex
 */
export async function getOngoingAlert({ sessionId, userId }, { knex: trx = DomainTransaction.getConnection() } = {}) {
  const alert = await trx('certification-companion-live-alerts')
    .select('certification-companion-live-alerts.*')
    .join('assessments', function () {
      this.on('assessments.id', 'certification-companion-live-alerts.assessmentId').andOnVal(
        'assessments.userId',
        userId,
      );
    })
    .join('certification-courses', function () {
      this.on('certification-courses.id', 'assessments.certificationCourseId').andOnVal(
        'certification-courses.sessionId',
        sessionId,
      );
    })
    .where({ 'certification-companion-live-alerts.status': CertificationCompanionLiveAlertStatus.ONGOING })
    .first()
    .forUpdate('certification-companion-live-alerts');

  if (!alert) return null;

  return new CertificationCompanionLiveAlert(alert);
}

/**
 * @param {CertificationCompanionLiveAlert}
 * @param {object} options
 * @param {import('knex').Knex} options.knex
 */
export async function update({ id, status }, { knex = DomainTransaction.getConnection() } = {}) {
  const trx = DomainTransaction.getConnection();

  await trx('certification-companion-live-alerts')
    .update({
      status,
      updatedAt: knex.fn.now(),
    })
    .where({
      id,
    });
}
