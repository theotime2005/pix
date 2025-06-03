import * as events from '../../../shared/domain/events/index.js';
import { usecases } from '../domain/usecases/index.js';

const neutralizeChallenge = async function (request, h, dependencies = { events }) {
  const challengeRecId = request.payload.data.attributes.challengeRecId;
  const certificationCourseId = request.payload.data.attributes.certificationCourseId;
  const juryId = request.auth.credentials.userId;
  const event = await usecases.neutralizeChallenge({
    challengeRecId,
    certificationCourseId,
    juryId,
  });
  // TODO : deprecated (no more handler)
  await dependencies.events.eventDispatcher.dispatch(event);
  return h.response().code(204);
};

const deneutralizeChallenge = async function (request, h, dependencies = { events }) {
  const challengeRecId = request.payload.data.attributes.challengeRecId;
  const certificationCourseId = request.payload.data.attributes.certificationCourseId;
  const juryId = request.auth.credentials.userId;
  const event = await usecases.deneutralizeChallenge({
    challengeRecId,
    certificationCourseId,
    juryId,
  });
  // TODO : deprecated (no more handler)
  await dependencies.events.eventDispatcher.dispatch(event);
  return h.response().code(204);
};

const certificationAdminController = {
  neutralizeChallenge,
  deneutralizeChallenge,
};

export { certificationAdminController };
