import dayjs from 'dayjs';

import { services as enrolmentServices } from '../../../../../src/certification/enrolment/application/services/index.js';
import { Candidate } from '../../../../../src/certification/enrolment/domain/models/Candidate.js';
import { SessionEnrolment } from '../../../../../src/certification/enrolment/domain/models/SessionEnrolment.js';
import { Subscription } from '../../../../../src/certification/enrolment/domain/models/Subscription.js';
import { usecases as enrolmentUseCases } from '../../../../../src/certification/enrolment/domain/usecases/index.js';
import { usecases as organizationalEntitiesUsecases } from '../../../../../src/organizational-entities/domain/usecases/index.js';
import {
  CertificationCenter,
  types as certificationCenterTypes,
} from '../../../../../src/shared/domain/models/CertificationCenter.js';
import { normalize } from '../../../../../src/shared/infrastructure/utils/string-utils.js';
import { usecases as teamUsecases } from '../../../../../src/team/domain/usecases/index.js';
import { CommonCertifiableUser } from '../shared/common-certifiable-user.js';
import { CommonPixCertifOrganization } from '../shared/common-organisation.js';
import {
  PUBLISHED_SCO_SESSION,
  SCO_CERTIFICATION_CENTER_EXTERNAL_ID,
  SCO_CERTIFICATION_CENTER_ID,
  STARTED_SCO_SESSION,
} from '../shared/constants.js';
import addSession from '../tools/add-session.js';
import publishSessionWithValidatedCertification from '../tools/publish-session-with-validated-certification.js';

/**
 * --- CERTIFICATION CASE ---
 *
 * The goal here is to reproduce the most simple certification case:
 *   - The organization is SCO and managing students
 *   - I'm a SCO orga learner with a certifiable account
 *   - I'm able to start a certification course
 *   - I have previously obtained a certif SCO with ~550 pix
 */
export class ScoManagingStudent {
  static USER_BIRTHDATE = '2000-01-01';

  constructor({ databaseBuilder }) {
    this.databaseBuilder = databaseBuilder;
  }

  async create() {
    const { organization, organizationMember } = await this.#addOrganization();
    const { certificationCenter } = await this.#addCertifCenter({ organizationMember });
    const { certifiableUser } = await this.#addCertifiableUser({ organization });

    /**
     * Session with candidat ready to start his certification
     */
    const sessionReadyToStart = await this.#addReadyToStartSession({
      certificationCenterMember: organizationMember,
      certificationCenter,
    });
    await this.#addCandidateToSession({ pixAppUser: certifiableUser, session: sessionReadyToStart });

    /**
     * Session with a published certification
     */
    const sessionToPublish = await this.#addSessionToPublish({
      certificationCenterMember: organizationMember,
      certificationCenter,
    });
    const candidateToPublish = await this.#addCandidateToSession({
      pixAppUser: certifiableUser,
      session: sessionToPublish,
    });

    await publishSessionWithValidatedCertification({
      databaseBuilder: this.databaseBuilder,
      sessionId: PUBLISHED_SCO_SESSION,
      candidateId: candidateToPublish.id,
      pixScoreTarget: 550,
    });
  }

  async #addOrganization() {
    const commonOrgaService = await CommonPixCertifOrganization.getInstance({ databaseBuilder: this.databaseBuilder });
    return {
      organization: commonOrgaService.organization,
      organizationMember: commonOrgaService.organizationMember,
    };
  }

  async #addCertifCenter({ organizationMember }) {
    const certificationCenter = await organizationalEntitiesUsecases.createCertificationCenter({
      certificationCenter: new CertificationCenter({
        id: SCO_CERTIFICATION_CENTER_ID,
        name: 'SCO Certification Center',
        type: certificationCenterTypes.SCO,
        externalId: SCO_CERTIFICATION_CENTER_EXTERNAL_ID,
        createdAt: new Date('2022-01-30'),
        habilitations: [],
      }),
      complementaryCertificationIds: [],
    });

    const certificationCenterMember = await teamUsecases.createCertificationCenterMembershipByEmail({
      certificationCenterId: certificationCenter.id,
      email: organizationMember.email,
    });

    return { certificationCenter, certificationCenterMember };
  }

  async #addCertifiableUser({ organization }) {
    const { certifiableUser } = await CommonCertifiableUser.getInstance({ databaseBuilder: this.databaseBuilder });

    const organizationLearner = await this.databaseBuilder.factory.buildOrganizationLearner({
      userId: certifiableUser.id,
      organizationId: organization.id,
      firstName: certifiableUser.firstName,
      lastName: certifiableUser.lastName,
      email: certifiableUser.email,
      division: 'Terminal',
      sex: 'F',
      birthdate: ScoManagingStudent.USER_BIRTHDATE,
      isCertifiable: true,
      isDisabled: false,
      certifiableAt: new Date('2022-01-30'),
      user: certifiableUser,
    });
    await this.databaseBuilder.commit();

    return { certifiableUser, organizationLearner };
  }

  async #addReadyToStartSession({ certificationCenterMember, certificationCenter }) {
    return addSession({
      databaseBuilder: this.databaseBuilder,
      createdByUserId: certificationCenterMember.id,
      forceSessionId: STARTED_SCO_SESSION,
      session: new SessionEnrolment({
        certificationCenterId: certificationCenter.id,
        address: 'Rennes',
        room: '28D',
        examiner: 'Jean Prea-demarrer',
        date: '2024-01-30',
        time: '14:30',
        description: 'SCO session with candidates ready to start',
      }),
    });
  }

  async #addCandidateToSession({ pixAppUser, session }) {
    const candidateBirthdate = ScoManagingStudent.USER_BIRTHDATE;
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
      subscriptions: [Subscription.buildCore({ certificationCandidateId: null })],
      userId: pixAppUser.id,
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

  async #addSessionToPublish({ certificationCenterMember, certificationCenter }) {
    return addSession({
      databaseBuilder: this.databaseBuilder,
      createdByUserId: certificationCenterMember.id,
      forceSessionId: PUBLISHED_SCO_SESSION,
      session: new SessionEnrolment({
        certificationCenterId: certificationCenter.id,
        address: 'Rennes',
        room: '28D',
        examiner: 'Anne-Cess Ionfinie',
        date: dayjs().format('YYYY-MM-DD'),
        time: '16:30',
        description: 'SCO session with published results',
      }),
    });
  }
}
