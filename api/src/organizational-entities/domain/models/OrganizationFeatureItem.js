export class OrganizationFeatureItem {
  constructor({ featureId, key, params } = {}) {
    this.featureId = featureId;
    this.name = key;
    this.params = params;
  }
}
