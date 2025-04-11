import _ from 'lodash';

import { knex } from '../../../../../db/knex-database-connection.js';
import { config } from '../../../../shared/config.js';
import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { Assessment } from '../../../../shared/domain/models/index.js';
import { ComplementaryCertificationCourse } from '../../../session-management/domain/models/ComplementaryCertificationCourse.js';
import { CertificationCourse } from '../../domain/models/CertificationCourse.js';
import { CertificationIssueReport } from '../../domain/models/CertificationIssueReport.js';
import * as certificationChallengeRepository from './certification-challenge-repository.js';

async function save({ certificationCourse }) {
  const knexConn = DomainTransaction.getConnection();

  const certificationCourseToSaveDTO = _adaptModelToDb(certificationCourse);
  const [{ id: certificationCourseId }] = await knexConn('certification-courses')
    .insert(certificationCourseToSaveDTO)
    .returning('id');

  const complementaryCertificationCourses = certificationCourse
    .toDTO()
    .complementaryCertificationCourses.map(({ complementaryCertificationId, complementaryCertificationBadgeId }) => ({
      complementaryCertificationId,
      complementaryCertificationBadgeId,
      certificationCourseId,
    }));

  if (!_.isEmpty(complementaryCertificationCourses)) {
    await knexConn('complementary-certification-courses').insert(complementaryCertificationCourses);
  }

  for (const certificationChallenge of certificationCourse.toDTO().challenges) {
    const certificationChallengeWithCourseId = {
      ...certificationChallenge,
      courseId: certificationCourseId,
    };
    await certificationChallengeRepository.save({
      certificationChallenge: certificationChallengeWithCourseId,
    });
  }

  return get({ id: certificationCourseId });
}

const _findAssessment = async function (certificationCourseId, knexConn = knex) {
  return knexConn('assessments').where({ certificationCourseId }).first();
};

const _findAllChallenges = async function (certificationCourseId, knexConn = knex) {
  return knexConn('certification-challenges').where({ courseId: certificationCourseId });
};

async function get({ id = null, verificationCode = null }) {
  const knexConn = DomainTransaction.getConnection();
  const certificationCourseDTO = await knexConn('certification-courses')
    .where({ id })
    .orWhere({ verificationCode })
    .first();

  if (!certificationCourseDTO) {
    throw new NotFoundError(`Certification course of id ${id} does not exist.`);
  }

  const assessmentDTO = await _findAssessment(certificationCourseDTO.id, knexConn);

  const certificationIssueReportsDTO = await knexConn('certification-issue-reports').where({
    certificationCourseId: certificationCourseDTO.id,
  });

  const complementaryCertificationCoursesDTO = await knexConn('complementary-certification-courses').where({
    certificationCourseId: certificationCourseDTO.id,
  });

  const challengesDTO = await _findAllChallenges(certificationCourseDTO.id, knexConn);

  let accessibilityAdjustmentNeeded;
  if (certificationCourseDTO.version === 3) {
    const configuration = await _getV3ConfigurationForCertificationCreationDate(
      certificationCourseDTO.createdAt,
      knexConn,
    );

    certificationCourseDTO.numberOfChallenges =
      configuration?.maximumAssessmentLength ?? config.v3Certification.numberOfChallengesPerCourse;

    ({ accessibilityAdjustmentNeeded } = await knexConn('certification-candidates')
      .select('accessibilityAdjustmentNeeded')
      .where({
        userId: certificationCourseDTO.userId,
        sessionId: certificationCourseDTO.sessionId,
      })
      .first());
  }

  return _toDomain({
    certificationCourseDTO,
    challengesDTO,
    assessmentDTO,
    complementaryCertificationCoursesDTO,
    certificationIssueReportsDTO,
    accessibilityAdjustmentNeeded,
  });
}

function _toDomain({
  certificationCourseDTO,
  challengesDTO = [],
  assessmentDTO = {},
  complementaryCertificationCoursesDTO = [],
  certificationIssueReportsDTO = [],
  accessibilityAdjustmentNeeded,
}) {
  const complementaryCertificationCourses = complementaryCertificationCoursesDTO.map(
    (complementaryCertificationCourseDTO) => new ComplementaryCertificationCourse(complementaryCertificationCourseDTO),
  );

  const certificationIssueReports = certificationIssueReportsDTO.map(
    (certificationIssueReportDTO) => new CertificationIssueReport(certificationIssueReportDTO),
  );

  const assessment = new Assessment(assessmentDTO);

  return new CertificationCourse({
    ...certificationCourseDTO,
    assessment,
    challenges: challengesDTO,
    complementaryCertificationCourses,
    certificationIssueReports,
    isAdjustedForAccessibility: accessibilityAdjustmentNeeded,
  });
}

async function _getV3ConfigurationForCertificationCreationDate(createdAt, knexConn) {
  return knexConn('flash-algorithm-configurations')
    .where('createdAt', '<=', createdAt)
    .orderBy('createdAt', 'desc')
    .first();
}

async function getSessionId({ id }) {
  const knexConn = DomainTransaction.getConnection();

  const row = await knexConn('certification-courses').select('sessionId').where({ id }).first();
  if (!row) {
    throw new NotFoundError(`Certification course of id ${id} does not exist`);
  }

  return row.sessionId;
}

async function findOneCertificationCourseByUserIdAndSessionId({ userId, sessionId }) {
  const knexConn = DomainTransaction.getConnection();

  const certificationCourseDTO = await knexConn('certification-courses')
    .where({ userId, sessionId })
    .orderBy('createdAt', 'desc')
    .first();

  if (!certificationCourseDTO) {
    return null;
  }

  const assessmentDTO = await _findAssessment(certificationCourseDTO.id, knexConn);

  const challengesDTO = await _findAllChallenges(certificationCourseDTO.id, knexConn);

  if (certificationCourseDTO.version === 3) {
    const configuration = await _getV3ConfigurationForCertificationCreationDate(
      certificationCourseDTO.createdAt,
      knexConn,
    );

    certificationCourseDTO.numberOfChallenges =
      configuration?.maximumAssessmentLength ?? config.v3Certification.numberOfChallengesPerCourse;
  }

  return _toDomain({
    certificationCourseDTO,
    challengesDTO,
    assessmentDTO,
    complementaryCertificationCoursesDTO: [],
    certificationIssueReportsDTO: [],
  });
}

async function update({ certificationCourse, noTransaction = false }) {
  const knexConn = noTransaction ? knex : DomainTransaction.getConnection();

  const certificationCourseData = _pickUpdatableProperties(certificationCourse);

  const nbOfUpdatedCertificationCourses = await knexConn('certification-courses')
    .update({ ...certificationCourseData, updatedAt: new Date() })
    .where({ id: certificationCourseData.id });

  if (nbOfUpdatedCertificationCourses === 0) {
    throw new NotFoundError(`No rows updated for certification course of id ${certificationCourse.getId()}.`);
  }

  return get({ id: certificationCourseData.id });
}

async function isVerificationCodeAvailable({ verificationCode }) {
  const knexConn = DomainTransaction.getConnection();

  const exist = await knexConn('certification-courses')
    .select('id')
    .whereRaw('UPPER(??)=?', ['verificationCode', verificationCode.toUpperCase()])
    .first();

  return !exist;
}

async function findCertificationCoursesBySessionId({ sessionId }) {
  const knexConn = DomainTransaction.getConnection();

  const certificationCoursesDTO = await knexConn('certification-courses').where({ sessionId });

  return certificationCoursesDTO.map((certificationCourseDTO) => _toDomain({ certificationCourseDTO }));
}

export {
  findCertificationCoursesBySessionId,
  findOneCertificationCourseByUserIdAndSessionId,
  get,
  getSessionId,
  isVerificationCodeAvailable,
  save,
  update,
};

function _adaptModelToDb(certificationCourse) {
  return _.omit(certificationCourse.toDTO(), [
    'complementaryCertificationCourses',
    'certificationIssueReports',
    'assessment',
    'challenges',
    'createdAt',
    'numberOfChallenges',
    'isAdjustedForAccessibility',
  ]);
}

function _pickUpdatableProperties(certificationCourse) {
  // isCancelled will be removed
  return _.pick(certificationCourse.toDTO(), [
    'id',
    'isCancelled',
    'birthdate',
    'birthplace',
    'firstName',
    'lastName',
    'sex',
    'birthCountry',
    'birthINSEECode',
    'birthPostalCode',
    'abortReason',
    'completedAt',
    'isRejectedForFraud',
  ]);
}
