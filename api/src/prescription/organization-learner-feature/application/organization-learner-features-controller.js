import { usecases } from '../domain/usecases/index.js';

const create = async function (request, h) {
  const organizationId = request.params.organizationId;
  const organizationLearnerId = request.params.organizationLearnerId;
  const featureKey = request.params.featureKey;

  const organizationLearnerFeature = await usecases.createOrganizationLearnerFeature({
    organizationId,
    organizationLearnerId,
    featureKey,
  });

  return h.response(organizationLearnerFeature).code(201);
};

const unlink = async function (request, h) {
  const organizationId = request.params.organizationId;
  const organizationLearnerId = request.params.organizationLearnerId;
  const featureKey = request.params.featureKey;

  const organizationLearnerFeature = await usecases.unlinkOrganizationLearnerFeature({
    organizationId,
    organizationLearnerId,
    featureKey,
  });

  return h.response(organizationLearnerFeature);
};

const organizationLearnerFeaturesController = {
  create,
  unlink,
};

export { organizationLearnerFeaturesController };
