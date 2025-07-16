import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { CertificationCandidateNotFoundError } from '../../../../shared/domain/errors.js';
import { Candidate } from '../../domain/models/Candidate.js';

export const findByAssessmentId = async function ({ assessmentId }) {
  const trx = DomainTransaction.getConnection();
  const result = await trx('certification-candidates')
    .select('certification-candidates.accessibilityAdjustmentNeeded', 'certification-candidates.reconciledAt')
    .join('certification-courses', function () {
      this.on('certification-courses.userId', '=', 'certification-candidates.userId').andOn(
        'certification-courses.sessionId',
        '=',
        'certification-candidates.sessionId',
      );
    })
    .join('assessments', 'assessments.certificationCourseId', 'certification-courses.id')
    .where('assessments.id', assessmentId)
    .first();

  if (!result) {
    throw new CertificationCandidateNotFoundError();
  }

  return _toDomain(result);
};

const _toDomain = ({ accessibilityAdjustmentNeeded, reconciledAt }) => {
  return new Candidate({ accessibilityAdjustmentNeeded, reconciledAt });
};
