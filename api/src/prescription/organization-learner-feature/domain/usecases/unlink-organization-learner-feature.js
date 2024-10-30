const unlinkOrganizationLearnerFeature = async ({
  organizationId,
  organizationLearnerId,
  featureKey,
  organizationFeaturesAPI,
  organizationLearnerFeatureRepository,
}) => {
  //Get OrganizationFeature and FeatureID througth API instead of direct SQL from this domain repo
  const organizationFeature = await organizationFeaturesAPI.getFeatureByKey(featureKey, organizationId);

  return await organizationLearnerFeatureRepository.unlink({
    organizationLearnerId,
    featureId: organizationFeature.featureId,
  });
};
export { unlinkOrganizationLearnerFeature };
