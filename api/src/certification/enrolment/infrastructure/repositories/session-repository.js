import _ from 'lodash';

import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { SessionEnrolment } from '../../domain/models/SessionEnrolment.js';

export async function save({ session }) {
  const knexConn = DomainTransaction.getConnection();
  const [savedSession] = await knexConn('sessions')
    .insert({
      accessCode: session.accessCode,
      address: session.address,
      certificationCenter: session.certificationCenter,
      date: session.date,
      description: session.description,
      examiner: session.examiner,
      room: session.room,
      time: session.time,
      certificationCenterId: session.certificationCenterId,
      invigilatorPassword: session.invigilatorPassword,
      version: session.version,
      createdBy: session.createdBy,
    })
    .returning('*');

  return new SessionEnrolment(savedSession);
}

export async function get({ id }) {
  const trx = DomainTransaction.getConnection();

  const foundSession = await trx
    .select('sessions.*')
    .select({ certificationCenterType: 'certification-centers.type' })
    .from('sessions')
    .join('certification-centers', 'certification-centers.id', 'sessions.certificationCenterId')
    .where('sessions.id', id)
    .first();
  if (!foundSession) {
    throw new NotFoundError("La session n'existe pas ou son accès est restreint");
  }
  return new SessionEnrolment({ ...foundSession, certificationCandidates: [] });
}

export async function isSessionExistingByCertificationCenterId({ address, room, date, time, certificationCenterId }) {
  const trx = DomainTransaction.getConnection();

  const sessions = await trx('sessions').where({ address, room, date, time }).andWhere({ certificationCenterId });
  return sessions.length > 0;
}

export async function isSessionExistingBySessionAndCertificationCenterIds({ sessionId, certificationCenterId }) {
  const trx = DomainTransaction.getConnection();
  const [session] = await trx('sessions').where({ id: sessionId, certificationCenterId });
  return Boolean(session);
}

export async function update(session) {
  const trx = DomainTransaction.getConnection();
  const sessionDataToUpdate = _.pick(session, [
    'address',
    'room',
    'accessCode',
    'examiner',
    'date',
    'time',
    'description',
  ]);

  await trx('sessions').where({ id: session.id }).update(sessionDataToUpdate).returning('*');
}

export async function remove({ id }) {
  await DomainTransaction.execute(async (trx) => {
    const certificationCandidateIdsInSession = await trx('certification-candidates')
      .where({ sessionId: id })
      .pluck('id');
    const supervisorAccessIds = await trx('supervisor-accesses').where({ sessionId: id }).pluck('id');

    if (supervisorAccessIds) {
      await trx('supervisor-accesses').whereIn('id', supervisorAccessIds).del();
    }

    if (certificationCandidateIdsInSession.length) {
      await trx('certification-subscriptions')
        .whereIn('certificationCandidateId', certificationCandidateIdsInSession)
        .del();
      await trx('certification-candidates').whereIn('id', certificationCandidateIdsInSession).del();
    }
    const nbSessionsDeleted = await trx('sessions').where('id', id).del();
    if (nbSessionsDeleted === 0) throw new NotFoundError();
  });
}
