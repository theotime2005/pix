import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { CertificationFrameworksChallenge } from '../../domain/models/CertificationFrameworksChallenge.js';

export async function find({ createdAt, complementaryCertificationKey }) {
  const knexConn = DomainTransaction.getConnection();

  const certificationFrameworksChallengesDTO = await knexConn('certification-frameworks-challenges')
    .where({
      complementaryCertificationKey,
      createdAt,
    })
    .orderBy('challengeId');

  if (!certificationFrameworksChallengesDTO) {
    return null;
  }

  return certificationFrameworksChallengesDTO.map((certificationFrameworksChallengeDTO) =>
    _toDomain({ certificationFrameworksChallengeDTO }),
  );
}

export async function save(certificationFrameworksChallenges) {
  const knexConn = DomainTransaction.getConnection();

  for (const calibratedCertificationFrameworksChallenge of certificationFrameworksChallenges) {
    const { alpha, delta, complementaryCertificationKey, createdAt, challengeId } =
      calibratedCertificationFrameworksChallenge;
    await knexConn('certification-frameworks-challenges')
      .update({
        alpha,
        delta,
      })
      .where({ complementaryCertificationKey, createdAt, challengeId });
  }
}

function _toDomain({ certificationFrameworksChallengeDTO }) {
  return new CertificationFrameworksChallenge(certificationFrameworksChallengeDTO);
}
