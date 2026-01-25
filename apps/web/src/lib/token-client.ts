export class TokenClient {
  private token: string | null = null;

  setAuth(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }
}
