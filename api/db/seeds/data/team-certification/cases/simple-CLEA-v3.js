import dayjs from 'dayjs';

import { services as enrolmentServices } from '../../../../../src/certification/enrolment/application/services/index.js';
import { Candidate } from '../../../../../src/certification/enrolment/domain/models/Candidate.js';
import { SessionEnrolment } from '../../../../../src/certification/enrolment/domain/models/SessionEnrolment.js';
import { Subscription } from '../../../../../src/certification/enrolment/domain/models/Subscription.js';
import { usecases as enrolmentUseCases } from '../../../../../src/certification/enrolment/domain/usecases/index.js';
import { BILLING_MODES } from '../../../../../src/certification/shared/domain/constants.js';
import { ComplementaryCertificationKeys } from '../../../../../src/certification/shared/domain/models/ComplementaryCertificationKeys.js';
import { usecases as organizationalEntitiesUsecases } from '../../../../../src/organizational-entities/domain/usecases/index.js';
import { usecases as prescriptionTargetProfilesUsecases } from '../../../../../src/prescription/target-profile/domain/usecases/index.js';
import {
  CertificationCenter,
  types as certificationCenterTypes,
} from '../../../../../src/shared/domain/models/CertificationCenter.js';
import { normalize } from '../../../../../src/shared/infrastructure/utils/string-utils.js';
import { usecases as teamUsecases } from '../../../../../src/team/domain/usecases/index.js';
import {
  CLEA_COMPLEMENTARY_CERTIFICATION_ID,
  CLEA_V2_TARGET_PROFILE_ID,
} from '../../common/complementary-certification-builder.js';
import { CommonCertifiableUser } from '../shared/common-certifiable-user.js';
import { CommonPixCertifOrganization } from '../shared/common-organisation.js';
import {
  DOUBLE_CERTIFICATION_CLEA_CERTIFICATION_CENTER_EXTERNAL_ID,
  PUBLISHED_DOUBLE_CERTIFICATION_CLEA_SESSION,
  STARTED_DOUBLE_CERTIFICATION_CLEA_SESSION,
} from '../shared/constants.js';
import addSession from '../tools/add-session.js';
import obtainCleaBadgeForUser from '../tools/double-certification/obtain-clea-badge-for-user.js';
import publishSessionWithValidatedCertification from '../tools/publish-session-with-validated-certification.js';

/**
 * --- CERTIFICATION CASE ---
 *
 * The goal here is to reproduce one certification case:
 *   - The organization is PRO with CLEA habilitation
 *   - I'm a pix app user with a certifiable account and the certifiable badge required for CLEA double-certification
 *   - I'm able to start a certification course
 *   - I have previously obtained a certif CLEA with ~350 pix
 */
export class CleaV3Seed {
  constructor({ databaseBuilder }) {
    this.databaseBuilder = databaseBuilder;
  }

  async create() {
    const { organization, organizationMember } = await this.#addOrganization();

    const { certificationCenter, certificationCenterMember } = await this.#addCertifCenter({ organizationMember });
    const certifiableUser = await this.#addCertifiableUser();
    await obtainCleaBadgeForUser({
      databaseBuilder: this.databaseBuilder,
      organizationId: organization.id,
      organizationMemberId: organizationMember.id,
      certifiableUserId: certifiableUser.id,
    });

    /**
     * Session with candidat ready to start his certification
     */
    const sessionReadyToStart = await this.#addReadyToStartSession({ certificationCenterMember, certificationCenter });
    await this.#addCandidateToSession({ pixAppUser: certifiableUser, session: sessionReadyToStart });

    /**
     * Session with a published certification
     */
    const sessionToPublish = await this.#addSessionToPublish({ certificationCenterMember, certificationCenter });
    const candidateToPublish = await this.#addCandidateToSession({
      pixAppUser: certifiableUser,
      session: sessionToPublish,
    });

    await publishSessionWithValidatedCertification({
      databaseBuilder: this.databaseBuilder,
      sessionId: PUBLISHED_DOUBLE_CERTIFICATION_CLEA_SESSION,
      candidateId: candidateToPublish.id,
      pixScoreTarget: 350,
    });
  }

  async #addOrganization() {
    const { organization, organizationMember } = await CommonPixCertifOrganization.getInstance({
      databaseBuilder: this.databaseBuilder,
    });

    const cleaTargetProfile = await prescriptionTargetProfilesUsecases.getTargetProfile({
      targetProfileId: CLEA_V2_TARGET_PROFILE_ID,
    });

    prescriptionTargetProfilesUsecases.attachTargetProfilesToOrganization({
      organizationId: organization.id,
      targetProfileIds: [cleaTargetProfile.id],
    });

    return { organization, organizationMember };
  }

  async #addCertifCenter({ organizationMember }) {
    const certificationCenter = await organizationalEntitiesUsecases.createCertificationCenter({
      certificationCenter: new CertificationCenter({
        id: DOUBLE_CERTIFICATION_CLEA_CERTIFICATION_CENTER_EXTERNAL_ID,
        name: 'CLEA V3 Certification Center',
        type: certificationCenterTypes.PRO,
        externalId: DOUBLE_CERTIFICATION_CLEA_CERTIFICATION_CENTER_EXTERNAL_ID,
        createdAt: new Date('2024-01-30'),
        habilitations: [ComplementaryCertificationKeys.CLEA],
      }),
      complementaryCertificationIds: [CLEA_COMPLEMENTARY_CERTIFICATION_ID],
    });

    const certificationCenterMember = await teamUsecases.createCertificationCenterMembershipByEmail({
      certificationCenterId: certificationCenter.id,
      email: organizationMember.email,
    });

    return { certificationCenter, certificationCenterMember };
  }

  async #addCertifiableUser() {
    const { certifiableUser } = await CommonCertifiableUser.getInstance({ databaseBuilder: this.databaseBuilder });
    return certifiableUser;
  }

  async #addReadyToStartSession({ certificationCenterMember, certificationCenter }) {
    return addSession({
      databaseBuilder: this.databaseBuilder,
      createdByUserId: certificationCenterMember.user.id,
      forceSessionId: STARTED_DOUBLE_CERTIFICATION_CLEA_SESSION,
      session: new SessionEnrolment({
        certificationCenterId: certificationCenter.id,
        address: 'Valenciennes',
        room: '59',
        examiner: 'Jean Prea-demarrer',
        date: '2024-06-04',
        time: '09:10',
        description: 'CLEA V3 session with candidate ready to start',
      }),
    });
  }

  async #addSessionToPublish({ certificationCenterMember, certificationCenter }) {
    return addSession({
      databaseBuilder: this.databaseBuilder,
      createdByUserId: certificationCenterMember.user.id,
      forceSessionId: PUBLISHED_DOUBLE_CERTIFICATION_CLEA_SESSION,
      session: new SessionEnrolment({
        certificationCenterId: certificationCenter.id,
        address: 'Valenciennes',
        room: '59',
        examiner: 'Anne-Cess Ionfinie',
        date: dayjs().format('YYYY-MM-DD'),
        time: '16:30',
        description: 'CLEA V3 session with published results',
      }),
    });
  }

  async #addCandidateToSession({ pixAppUser, session }) {
    const candidateBirthdate = '2000-10-30';

    const candidate = new Candidate({
      authorizedToStart: true,
      firstName: pixAppUser.firstName,
      lastName: pixAppUser.lastName,
      sex: 'F',
      birthdate: new Date(candidateBirthdate),
      birthCountry: 'France',
      birthINSEECode: '75115',
      email: pixAppUser.email,
      isLinked: true,
      hasSeenCertificationInstructions: false,
      accessibilityAdjustmentNeeded: false,
      subscriptions: [
        Subscription.buildCore({ certificationCandidateId: null }),
        Subscription.buildComplementary({
          certificationCandidateId: null,
          complementaryCertificationId: CLEA_COMPLEMENTARY_CERTIFICATION_ID,
        }),
      ],
      userId: pixAppUser.id,
      billingMode: BILLING_MODES.FREE,
    });

    const candidateId = await enrolmentUseCases.addCandidateToSession({
      sessionId: session.id,
      candidate: new Candidate(candidate), // Warning: usecase modifies the entry model...
      normalizeStringFnc: normalize,
    });

    await enrolmentServices.registerCandidateParticipation({
      userId: pixAppUser.id,
      sessionId: session.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      birthdate: candidateBirthdate,
      normalizeStringFnc: normalize,
    });

    return enrolmentUseCases.getCandidate({ certificationCandidateId: candidateId });
  }
}
