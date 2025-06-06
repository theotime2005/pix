import { usecases } from '../../evaluation/domain/usecases/index.js';
import CertificationRescored from '../domain/events/CertificationRescored.js';

const rescoreCertification = async function (request, h) {
  const juryId = request.auth.credentials.userId;
  const certificationCourseId = request.params.certificationCourseId;

  await usecases.handleCertificationRescoring({ event: new CertificationRescored({ certificationCourseId, juryId }) });

  return h.response().code(201);
};

const certificationRescoringController = {
  rescoreCertification,
};

export { certificationRescoringController };
