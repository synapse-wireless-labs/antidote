# Antidote

## Minimal dependency injection container for TypeScript applications

Antidote is a general-purpose dependency injection container for TypeScript applications
with a focus on zero-configuration, light-weight APIs (only four functions!), and async applications.

### Getting Started

In an Antidote application services are composed of either class-based services or tokens. Services and tokens can inject other services and tokens to form the dependency graph. You then create an injector to start resolving members of the graph:

```ts
import { createToken, createInjector, Service } from '@antidote/core';

export interface AppConfig {
  name: string;
}
export const Config = createToken('AppConfig', {
  deps: [],
  produce: (): AppConfig => ({
    name: 'My First Antidote App',
  }),
});

@Service({
  deps: [],
  produce: () => console,
})
export class Console {
  log(...values: any[]): void {
    throw new Error('Not implemented');
  }
}

@Service()
export class App {
  constructor(
    public console: Console,
    @Inject(Config) public config: AppConfig
  ) {}

  run() {
    this.console.log(this.config.name);
  }
}

createInjector()
  .get(App)
  .then(app => app.run(), console.error);
```

Unlike many other dependency injection container implementations Antidote does not need to know about all of the services up front. Antidote lazily resolves dependencies as it encounters them and supports resolving dependencies asynchronously. It also guarantees that only once instance will be produced for a given service or token.

### Testing

A key advantage of using a dependency injection container is that it makes testing a little easier. Antidote ships with mocking utilities for Jest and Jasmine that help you test your services:

```ts
import { createInjector, provide } from '@antidote/core';
import { provideAutoMock } from '@antidote/testing';

describe('App Service', () => {
  let app: App;

  beforeEach(async () => {
    const injector = createInjector([
      provideAutoMock(Console),
      provide(Config, { produce: () => ({ name: 'Mock Name' }) }),
    ]);

    app = await injector.get(App);
  });

  it('should log out the name when the application runs', () => {
    app.run();

    expect(app.console.log).toHaveBeenCalledWith(app.config.name);
  });
});
```
