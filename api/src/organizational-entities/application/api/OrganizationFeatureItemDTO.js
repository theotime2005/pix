export class OrganizationFeatureItemDTO {
  constructor({ featureId, name, params }) {
    this.name = name;
    this.params = params;
    this.featureId = featureId;
  }
}
