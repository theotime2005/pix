class StageCollection {
  constructor({ campaignId, stages }) {
    this._id = campaignId;
    this._stages = stages;
    this._totalStages = stages.length;
  }

  get hasStage() {
    return this._totalStages > 0;
  }

  get stages() {
    return this._stages;
  }

  get totalStages() {
    return this._totalStages;
  }

  get stageIds() {
    return this.stages.map(({ id }) => id);
  }
}

export { StageCollection };
