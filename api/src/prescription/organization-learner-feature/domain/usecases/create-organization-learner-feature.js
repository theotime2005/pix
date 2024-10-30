const createOrganizationLearnerFeature = async ({
  organizationId,
  organizationLearnerId,
  featureKey,
  organizationFeaturesAPI,
  organizationLearnerFeatureRepository,
}) => {
  //Get OrganizationFeature and FeatureID througth API instead of direct SQL from this domain repo
  const organizationFeature = await organizationFeaturesAPI.getFeatureByKey(featureKey, organizationId);

  return await organizationLearnerFeatureRepository.create({
    organizationLearnerId,
    featureId: organizationFeature.featureId,
  });
};
export { createOrganizationLearnerFeature };
