import { JuryCertificationSummary } from '../../../../src/certification/session-management/domain/read-models/JuryCertificationSummary.js';
import { AssessmentResult } from '../../../../src/shared/domain/models/index.js';

const buildJuryCertificationSummary = function ({
  id = 123,
  firstName = 'Jean',
  lastName = 'Bon',
  status = AssessmentResult.status.VALIDATED,
  pixScore = 100,
  createdAt = new Date('2020-01-01'),
  completedAt = new Date('2020-01-02'),
  abortReason = null,
  isPublished = true,
  isEndedBySupervisor = false,
  complementaryCertificationTakenLabel,
  certificationIssueReports = [],
} = {}) {
  return new JuryCertificationSummary({
    id,
    firstName,
    lastName,
    status,
    pixScore,
    createdAt,
    completedAt,
    abortReason,
    isPublished,
    isEndedBySupervisor,
    complementaryCertificationTakenLabel,
    certificationIssueReports,
  });
};

export { buildJuryCertificationSummary };
