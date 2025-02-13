export class ClientApplication {
  constructor({ id, name, clientId, clientSecret, scopes }) {
    this.id = id;
    this.name = name;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scopes = scopes;
  }
}
