export const getOrganizationFeatureByKey = async function ({
  featureKey,
  organizationId,
  organizationFeatureRepository,
}) {
  return await organizationFeatureRepository.getOrganizationFeatureByKeyAndOrganizationId({
    featureKey,
    organizationId,
  });
};
